import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { json } from "stream/consumers";
import { object, z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  studentId: text("student_id").unique(),
  role: text("role", { enum: ["admin", "faculty", "club_head", "member"] }).notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const clubs = pgTable("clubs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  date: timestamp("date").defaultNow(),
  details: text("details"),
  time: text("time").notNull(),
  location: text("location").notNull(),
  maxParticipants: integer("max_participants"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const memberships = pgTable("memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  clubId: varchar("club_id").references(() => clubs.id).notNull(),
  role: text("role", { enum: ["member", "club_head"] }).default("member"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  requestedAt: timestamp("requested_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
});
export const recentActivities = pgTable("recent_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: text("activity_type").notNull(), // e.g., 'membership_request', 'membership_approved', 'membership_rejected', 'event_created'
  details: text("details"), // Additional details about the activity
  createdAt: timestamp("created_at").defaultNow(),
});
export const eventRegistrations = pgTable("event_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eventId: varchar("event_id").references(() => events.id).notNull(),
  registeredAt: timestamp("registered_at").defaultNow(),
  attended: boolean("attended").default(false),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  systemName: text("system_name").notNull(),
  systemDescription: text("system_description"),
  maintenanceMode: boolean("maintenance_mode").default(false),
  registrationEnabled: boolean("registration_enabled").default(true),
  defaultUserRole: text("default_user_role", { enum: ["member", "club_head", "faculty", "admin"] }).notNull().default("member"),
  maxEventsPerClub: integer("max_events_per_club").notNull().default(10),
  maxMembersPerClub: integer("max_members_per_club").notNull().default(100),
  autoApproveMembers: boolean("auto_approve_members").default(false),
  allowEventRegistration: boolean("allow_event_registration").default(true),
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertClubSchema = createInsertSchema(clubs).omit({ 
  id: true, 
  createdAt: true, 
  createdBy: true 
});

export const insertEventSchema = createInsertSchema(events).omit({ 
  id: true, 
  createdAt: true, 
  createdBy: true 
});

export const insertMembershipSchema = createInsertSchema(memberships).omit({ 
  id: true, 
  requestedAt: true, 
  approvedAt: true, 
  approvedBy: true 
});

export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({ 
  id: true, 
  registeredAt: true 
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({ 
  id: true, 
  updatedAt: true, 
  updatedBy: true 
});

export const recentActivitySchema = createInsertSchema(recentActivities).omit({ 
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClub = z.infer<typeof insertClubSchema>;
export type Club = typeof clubs.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof memberships.$inferSelect;
export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type RecentActivity = typeof recentActivities.$inferSelect;