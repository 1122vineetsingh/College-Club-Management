import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { insertClubSchema, insertEventSchema, insertMembershipSchema, insertEventRegistrationSchema, insertUserSchema, insertSystemSettingsSchema } from "@shared/schema";
import * as Users from './controllers/users';
import * as Clubs from './controllers/clubs';
import * as Events from './controllers/events';
import * as Memberships from './controllers/memberships';
import * as Registrations from './controllers/registrations';
import * as SystemCtrl from './controllers/system';
import { z } from "zod";
import { RecentActivityModel } from './models';
import { logActivity } from './utils/activityLogger'; // Import the logger

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
 app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const stats = await SystemCtrl.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // New: Upcoming events for dashboard (next 5)
  app.get("/api/dashboard/events", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const allEvents = await Events.listEvents();
      const upcoming = (allEvents ?? [])
        .filter((e: any) => {
          try { return new Date(e.date) >= new Date(); } catch { return false; }
        })
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming events" });
    }
  });

  // New: Recent activity endpoint used by dashboard
  app.get("/api/recent-activity", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    try {
      const activities = await RecentActivityModel.find().sort({ createdAt: -1 }).limit(50).lean();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });
  // User routes (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
  const users = await Users.listUsers();
  res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
  const userData = insertUserSchema.omit({ password: true }).partial().parse(req.body);
  const user = await Users.updateUser(req.params.id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    try {
  const success = await Users.deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Club routes
  app.get("/api/clubs", async (req, res) => {
    try {
  const clubs = await Clubs.listClubs();
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clubs" });
    }
  });

  app.get("/api/clubs/:id", async (req, res) => {
    try {
  const club = await Clubs.getClub(req.params.id);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch club" });
    }
  });

  app.post("/api/clubs", async (req, res) => {
  if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty')) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const clubData = insertClubSchema.parse(req.body);
    const club = await Clubs.createClub(clubData, req.user.id);
    
    // Log activity for club creation
    await logActivity(req.user.id, 'club_created', club.id, undefined);

    res.status(201).json(club);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid club data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create club" });
  }
});
  app.put("/api/clubs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
  const clubData = insertClubSchema.partial().parse(req.body);
  const club = await Clubs.updateClub(req.params.id, clubData);
      if (!club) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json(club);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid club data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update club" });
    }
  });

  app.delete("/api/clubs/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
  const success = await Clubs.deleteClub(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Club not found" });
      }
      res.json({ message: "Club deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete club" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
  const events = await Events.listEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
  const event = await Events.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
  if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.role !== 'club_head')) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
   const parsedDate = new Date(req.body.date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    const eventData = { ...req.body, date: parsedDate };
    let validatedEventData = insertEventSchema.parse(eventData);
    const club = await Clubs.getClub(validatedEventData.clubId);
    validatedEventData.details = club?.name ?? null;
    const event = await Events.createEvent(validatedEventData, req.user.id);
    await logActivity(
      req.user.id,
      'event_created',
      event.clubId,
      event.id
    );
    res.status(201).json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid event data", errors: error.errors });
    }
    console.log(error)
    res.status(500).json({ message: "Failed to create event", error: error });
  }
});


  app.put("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.role !== 'club_head')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Get the event to check ownership
  const existingEvent = await Events.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // If user is club_head, verify they are club head of this event's club
      if (req.user.role === 'club_head') {
        const membership = await storage.getMembership(req.user.id, existingEvent.clubId);
        if (!membership || membership.role !== 'club_head' || membership.status !== 'approved') {
          return res.status(403).json({ message: "Unauthorized - You can only edit events for clubs you manage" });
        }
      }

  const eventData = insertEventSchema.partial().parse(req.body);
  const event = await Events.updateEvent(req.params.id, eventData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.role !== 'club_head')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Get the event to check ownership
  const existingEvent = await Events.getEvent(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      // If user is club_head, verify they are club head of this event's club
      if (req.user.role === 'club_head') {
        const membership = await storage.getMembership(req.user.id, existingEvent.clubId);
        if (!membership || membership.role !== 'club_head' || membership.status !== 'approved') {
          return res.status(403).json({ message: "Unauthorized - You can only delete events for clubs you manage" });
        }
      }

  const success = await Events.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Membership routes
  app.get("/api/memberships/user/:userId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
  const memberships = await Memberships.getMembershipsByUser(req.params.userId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch memberships" });
    }
  });

  app.get("/api/memberships/club/:clubId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
  const memberships = await Memberships.getMembershipsByClub(req.params.clubId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch club memberships" });
    }
  });

  app.get("/api/memberships/pending", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.role !== 'club_head')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
  const pendingMemberships = await Memberships.getPendingMemberships();
      res.json(pendingMemberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending memberships" });
    }
  });

  app.get("/api/memberships/approved", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
  const approvedMemberships = await Memberships.getApprovedMemberships();
      res.json(approvedMemberships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved memberships" });
    }
  });

  app.post("/api/memberships", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const membershipData = insertMembershipSchema.parse(req.body);
    const membership = await Memberships.createMembership(membershipData);
    
    // Log activity for membership request
   await logActivity(
      req.user.id,
      'membership_request',
      membership.clubId,
      undefined
    );

    res.status(201).json(membership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid membership data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create membership request" });
  }
});
  app.patch("/api/memberships/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== 'admin' && req.user.role !== 'faculty' && req.user.role !== 'club_head')) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      const updates = req.body;
      if (updates.status === 'approved') {
        updates.approvedBy = req.user.id;
      }
  const membership = await Memberships.updateMembership(req.params.id, updates);
      if (!membership) {
        return res.status(404).json({ message: "Membership not found" });
      }
      res.json(membership);
    } catch (error) {
      res.status(500).json({ message: "Failed to update membership" });
    }
  });

  // Event registration routes
  app.get("/api/event-registrations/:eventId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
  const registrations = await Registrations.getEventRegistrations(req.params.eventId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  });

  app.post("/api/event-registrations", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const registrationData = insertEventRegistrationSchema.parse(req.body);
    const registration = await Registrations.createEventRegistration(registrationData);
    
    // Log activity for event registration
    await logActivity(
      req.user.id,
      'event_registered',
      undefined,
      registration.eventId
    );
    res.status(201).json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to register for event" });
  }
});

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
  const stats = await SystemCtrl.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // System settings routes (admin only)
  app.get("/api/system/settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
  const settings = await SystemCtrl.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/system/settings", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized - Admin access required" });
    }

    try {
  const settingsData = insertSystemSettingsSchema.parse(req.body);
  const settings = await SystemCtrl.updateSystemSettings(settingsData, req.user.id);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
