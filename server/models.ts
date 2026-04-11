import mongoose from './db';
const { Schema } = mongoose;

export const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  studentId: { type: String, default: null },
  role: { type: String, enum: ['admin', 'faculty', 'club_head', 'member'], default: 'member' },
  createdAt: { type: Date, default: () => new Date() },
}, { collection: 'users' });

export const ClubSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
  createdBy: { type: String },
}, { collection: 'clubs' });

export const EventSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  clubId: { type: String, required: true },
  date: { type: Date, required: true },
  details: { type: String },
  time: { type: String, required: true },
  location: { type: String, required: true },
  maxParticipants: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
  createdBy: { type: String },
}, { collection: 'events' });

export const MembershipSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  clubId: { type: String, required: true },
  role: { type: String, enum: ['member', 'club_head'], default: 'member' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: () => new Date() },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: null },
}, { collection: 'memberships' });

export const EventRegistrationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  eventId: { type: String, required: true },
  registeredAt: { type: Date, default: () => new Date() },
  attended: { type: Boolean, default: false },
}, { collection: 'event_registrations' });

export const SystemSettingsSchema = new Schema({
  id: { type: String, required: true, unique: true },
  systemName: { type: String, required: true },
  systemDescription: { type: String },
  maintenanceMode: { type: Boolean, default: false },
  registrationEnabled: { type: Boolean, default: true },
  defaultUserRole: { type: String, enum: ['member', 'club_head', 'faculty', 'admin'], default: 'member' },
  maxEventsPerClub: { type: Number, default: 10 },
  maxMembersPerClub: { type: Number, default: 100 },
  autoApproveMembers: { type: Boolean, default: false },
  allowEventRegistration: { type: Boolean, default: true },
  emailNotificationsEnabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: () => new Date() },
  updatedBy: { type: String, default: null },
}, { collection: 'system_settings' });

// new RecentActivity schema & model
export const RecentActivitySchema = new Schema({
  id: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['membership_request', 'membership_approved', 'membership_rejected', 'event_created', 'event_updated', 'event_cancelled', 'other'], 
    required: true 
  },
  clubId: { type: String, default: null },
  userId: { type: String, default: null },
  eventId: { type: String, default: null },
  details: { type: Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: () => new Date() },
  createdBy: { type: String, default: null },
}, { collection: 'recent_activity' });

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const ClubModel = mongoose.models.Club || mongoose.model('Club', ClubSchema);
export const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema);
export const MembershipModel = mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);
export const EventRegistrationModel = mongoose.models.EventRegistration || mongoose.model('EventRegistration', EventRegistrationSchema);
export const SystemSettingsModel = mongoose.models.SystemSettings || mongoose.model('SystemSettings', SystemSettingsSchema);
export const RecentActivityModel = mongoose.models.RecentActivity || mongoose.model('RecentActivity', RecentActivitySchema);