import { storage } from '../storage';
import type { InsertEvent, Event } from '@shared/schema';

export async function listEvents(): Promise<Event[]> {
  return storage.getAllEvents();
}

export async function getEvent(id: string): Promise<Event | undefined> {
  return storage.getEvent(id);
}

export async function createEvent(data: InsertEvent, createdBy: string): Promise<Event> {
  return storage.createEvent(data, createdBy);
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<Event | undefined> {
  return storage.updateEvent(id, data);
}

export async function deleteEvent(id: string): Promise<boolean> {
  return storage.deleteEvent(id);
}
