import { 
  type User, 
  type InsertUser,
  type Club,
  type InsertClub,
  type Event,
  type InsertEvent,
  type Membership,
  type InsertMembership,
  type EventRegistration,
  type InsertEventRegistration,
  type SystemSettings,
  type InsertSystemSettings
} from "@shared/schema";
export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Club operations
  getAllClubs(): Promise<Club[]>;
  getClub(id: string): Promise<Club | undefined>;
  createClub(club: InsertClub, createdBy: string): Promise<Club>;
  updateClub(id: string, updates: Partial<Club>): Promise<Club | undefined>;
  deleteClub(id: string): Promise<boolean>;
  
  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEventsByClub(clubId: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent, createdBy: string): Promise<Event>;
  updateEvent(id: string, updates: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Membership operations
  getMembershipsByUser(userId: string): Promise<Membership[]>;
  getMembershipsByClub(clubId: string): Promise<Membership[]>;
  getMembership(userId: string, clubId: string): Promise<Membership | undefined>;
  createMembership(membership: InsertMembership): Promise<Membership>;
  updateMembership(id: string, updates: Partial<Membership>): Promise<Membership | undefined>;
  getPendingMemberships(): Promise<Membership[]>;
  getApprovedMemberships(): Promise<Membership[]>;
  
  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getUserEventRegistrations(userId: string): Promise<EventRegistration[]>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalClubs: number;
    activeEvents: number;
    totalMembers: number;
    pendingRequests: number;
  }>;
  
  // System settings operations
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: InsertSystemSettings, updatedBy: string): Promise<SystemSettings>;
}
import { randomUUID } from 'crypto';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { connectDb } from './db';
import {
  UserModel,
  ClubModel,
  EventModel,
  MembershipModel,
  EventRegistrationModel,
  SystemSettingsModel,
} from './models';

//const MongoStore = connectMongo(session);

export class MongoStorage implements IStorage {
  public sessionStore: session.SessionStore;

  constructor() {
    // initialize session store using connect-mongo v4 API
    this.sessionStore = MongoStore.create({ mongoUrl: process.env.MONGODB_URI || 'mongodb+srv://ashwanisingh3:ZeN0WXg5lf5vtwRT@cluster0.wnsvo5g.mongodb.net/ClubSphere?appName=Cluster0' }) as unknown as session.SessionStore;
    // ensure DB is connected
    connectDb().then(() => console.log('[STORAGE] Connected to MongoDB')).catch(err => console.error('[STORAGE] MongoDB connection failed', err));
  }

  // User operations
  async getUser(id: string) {
    return UserModel.findOne({ id }).lean();
  }

  async getUserByEmail(email: string) {
    return UserModel.findOne({ email }).lean();
  }

  async getUserByUsername(username: string) {
    // username is email
    return this.getUserByEmail(username);
  }

  async getAllUsers() {
    return UserModel.find().lean();
  }

  async createUser(insertUser: InsertUser) {
    const id = randomUUID();
    const user = new UserModel({ ...insertUser, id, createdAt: new Date() });
    await user.save();
    return user.toObject();
  }

  async updateUser(id: string, updates: Partial<User>) {
    const updated = await UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated || undefined;
  }

  async deleteUser(id: string) {
    const res = await UserModel.deleteOne({ id });
    return res.deletedCount === 1;
  }

  // Club operations
  async getAllClubs() {
    return ClubModel.find({ isActive: true }).lean();
  }

  async getClub(id: string) {
    return ClubModel.findOne({ id }).lean();
  }

  async createClub(insertClub: InsertClub, createdBy: string) {
    const id = randomUUID();
    const club = new ClubModel({ ...insertClub, id, createdAt: new Date(), createdBy });
    await club.save();
    return club.toObject();
  }

  async updateClub(id: string, updates: Partial<Club>) {
    const updated = await ClubModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated || undefined;
  }

  async deleteClub(id: string) {
    const res = await ClubModel.deleteOne({ id });
    return res.deletedCount === 1;
  }

  // Event operations
  async getAllEvents() {
    return EventModel.find({ isActive: true }).lean();
  }

  async getEventsByClub(clubId: string) {
    return EventModel.find({ clubId, isActive: true }).lean();
  }

  async getEvent(id: string) {
    return EventModel.findOne({ id }).lean();
  }

  async createEvent(insertEvent: InsertEvent, createdBy: string) {
    const id = randomUUID();
    const event = new EventModel({ ...insertEvent, id, createdAt: new Date(), createdBy });
    await event.save();
    return event.toObject();
  }

  async updateEvent(id: string, updates: Partial<Event>) {
    const updated = await EventModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated || undefined;
  }

  async deleteEvent(id: string) {
    const res = await EventModel.deleteOne({ id });
    return res.deletedCount === 1;
  }

  // Membership operations
  async getMembershipsByUser(userId: string) {
    return MembershipModel.find({ userId }).lean();
  }

  async getMembershipsByClub(clubId: string) {
    return MembershipModel.find({ clubId }).lean();
  }

  async getMembership(userId: string, clubId: string) {
    return MembershipModel.findOne({ userId, clubId }).lean();
  }

  async createMembership(insertMembership: InsertMembership) {
    const id = randomUUID();
    const membership = new MembershipModel({ ...insertMembership, id, requestedAt: new Date(), approvedAt: null, approvedBy: null });
    await membership.save();
    return membership.toObject();
  }

  async updateMembership(id: string, updates: Partial<Membership>) {
    if (updates.status === 'approved') {
      // ensure approvedAt if approving
      (updates as any).approvedAt = new Date();
    }
    const updated = await MembershipModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
    return updated || undefined;
  }

  async getPendingMemberships() {
    const pending = await MembershipModel.find({ status: 'pending' }).lean();
    // join with user and club
    return Promise.all(pending.map(async (m: any) => ({ ...m, user: await UserModel.findOne({ id: m.userId }).lean(), club: await ClubModel.findOne({ id: m.clubId }).lean() })));
  }

  async getApprovedMemberships() {
    const approved = await MembershipModel.find({ status: 'approved' }).lean();
    return Promise.all(approved.map(async (m: any) => ({ ...m, user: await UserModel.findOne({ id: m.userId }).lean(), club: await ClubModel.findOne({ id: m.clubId }).lean() })));
  }

  // Event registration operations
  async getEventRegistrations(eventId: string) {
    return EventRegistrationModel.find({ eventId }).lean();
  }

  async getUserEventRegistrations(userId: string) {
    return EventRegistrationModel.find({ userId }).lean();
  }

  async createEventRegistration(insertRegistration: InsertEventRegistration) {
    const id = randomUUID();
    const reg = new EventRegistrationModel({ ...insertRegistration, id, registeredAt: new Date(), attended: false });
    await reg.save();
    return reg.toObject();
  }

  // Dashboard stats
  async getDashboardStats() {
    const totalClubs = await ClubModel.countDocuments({ isActive: true });
    const activeEvents = await EventModel.countDocuments({ isActive: true, date: { $gte: new Date() } });
    const totalMembers = await MembershipModel.countDocuments({ status: 'approved' });
    const pendingRequests = await MembershipModel.countDocuments({ status: 'pending' });
    return { totalClubs, activeEvents, totalMembers, pendingRequests };
  }

  // System settings operations
  async getSystemSettings() {
    let settings = await SystemSettingsModel.findOne().lean();
    if (!settings) {
      settings = {
        id: randomUUID(),
        systemName: 'College Club Management System',
        systemDescription: 'Manage clubs, events, and memberships efficiently',
        maintenanceMode: false,
        registrationEnabled: true,
        defaultUserRole: 'member',
        maxEventsPerClub: 10,
        maxMembersPerClub: 100,
        autoApproveMembers: false,
        allowEventRegistration: true,
        emailNotificationsEnabled: true,
        updatedAt: new Date(),
        updatedBy: null,
      } as SystemSettings;
      await new SystemSettingsModel(settings).save();
    }
    return settings;
  }

  async updateSystemSettings(settings: InsertSystemSettings, updatedBy: string) {
    const existing = await SystemSettingsModel.findOne().lean();
    if (!existing) {
      const doc = new SystemSettingsModel({ ...settings, id: randomUUID(), updatedAt: new Date(), updatedBy });
      await doc.save();
      return doc.toObject();
    }
    const updated = await SystemSettingsModel.findOneAndUpdate({}, { ...settings, updatedAt: new Date(), updatedBy }, { new: true }).lean();
    return updated as SystemSettings;
  }
}

export const storage = new MongoStorage();
