import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Auth-specific schemas for validation
const loginSchema = insertUserSchema.pick({ email: true, password: true });
const registerSchema = insertUserSchema.pick({ 
  email: true, 
  password: true, 
  name: true, 
  studentId: true 
}).extend({
  // Force role to be member for registration, admins must be created separately
  role: z.literal("member").default("member")
});

// Sanitize user data before sending to client (remove sensitive fields)
function toPublicUser(user: SelectUser) {
  const { password, ...publicUser } = user;
  return publicUser;
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Ensure we have a session secret and harden for production
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is required in production');
  }
  
  const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret-not-for-production';
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AUTH] Session secret configured:', sessionSecret.substring(0, 10) + '...');
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true, // Prevent XSS
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (username, password, done) => {
      console.log('[AUTH] Login attempt for username:', username);
      try {
        const user = await storage.getUserByUsername(username);
        console.log('[AUTH] User found:', user ? user.email : 'null');
        
        if (!user) {
          console.log('[AUTH] User not found');
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log('[AUTH] Password match:', passwordMatch);
        
        if (!passwordMatch) {
          console.log('[AUTH] Password mismatch');
          return done(null, false);
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AUTH] Login successful for:', user.email);
        }
        return done(null, user);
      } catch (error) {
        console.error('[AUTH] Login error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    // Validate registration data
    //email should have @college.edu at the end
    const registerResult = registerSchema.safeParse(req.body);
    if(!req.body.email.endsWith("@college.edu")){
      return res.status(400).json({ error: "Email must be a college.edu address" });
    }
    if (!registerResult.success) {
      return res.status(400).json({ error: "Invalid registration data", details: registerResult.error.issues });
    }
    
    const validatedData = registerResult.data;
    
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // Force role to be member - admins must be created through other means
    const user = await storage.createUser({
      ...validatedData,
      role: "member", // Always force member role for registration
      password: await hashPassword(validatedData.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(toPublicUser(user));
    });
  });

  app.post("/api/login", (req, res, next) => {
    // Validate login data
    const loginResult = loginSchema.safeParse(req.body);
    console.log('[AUTH] Login request received:', req.body);
    if (!loginResult.success) {
      return res.status(400).json({ error: "Invalid login data", details: loginResult.error.issues });
    }
    
    console.log('[AUTH] Login request body:', { email: req.body.username || req.body.email, hasPassword: !!req.body.password });
    
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        console.error('[AUTH] Authentication error:', err);
        return res.status(500).json({ message: 'Authentication error' });
      }
      
      if (!user) {
        console.log('[AUTH] Authentication failed:', info);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('[AUTH] Login session error:', err);
          return res.status(500).json({ message: 'Session error' });
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AUTH] Login successful, returning user:', user.email);
        }
        res.status(200).json(toPublicUser(user));
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(toPublicUser(req.user as SelectUser));
  });
}
