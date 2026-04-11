import { storage } from '../storage';
import type { InsertEventRegistration, EventRegistration } from '@shared/schema';

export async function getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
  return storage.getEventRegistrations(eventId);
}

export async function getUserEventRegistrations(userId: string): Promise<EventRegistration[]> {
  return storage.getUserEventRegistrations(userId);
}

export async function createEventRegistration(data: InsertEventRegistration): Promise<EventRegistration> {
  return storage.createEventRegistration(data);
}
