import { RecentActivityModel, UserModel, ClubModel, EventModel } from '../models';

export async function logActivity(
  userId: string,
  activityType: string,
  clubId?: string,
  eventId?: string
) {
  const user = await UserModel.findOne({ id: userId }).lean();
  const club = clubId ? await ClubModel.findOne({ id: clubId }).lean() : null;
  const event = eventId ? await EventModel.findOne({ id: eventId }).lean() : null;
  const activity = new RecentActivityModel({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    type: activityType,
    userId,
    clubId,
    eventId,
    createdBy: userId,
    details: {
      user,
      club,
      event,
    },
  });
  await activity.save();
}