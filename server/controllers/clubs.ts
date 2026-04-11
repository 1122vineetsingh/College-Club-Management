import { storage } from '../storage';
import type { InsertClub, Club } from '@shared/schema';

export async function listClubs(): Promise<Club[]> {
  return storage.getAllClubs();
}

export async function getClub(id: string): Promise<Club | undefined> {
  return storage.getClub(id);
}

export async function createClub(data: InsertClub, createdBy: string): Promise<Club> {
  return storage.createClub(data, createdBy);
}

export async function updateClub(id: string, data: Partial<Club>): Promise<Club | undefined> {
  return storage.updateClub(id, data);
}

export async function deleteClub(id: string): Promise<boolean> {
  return storage.deleteClub(id);
}
