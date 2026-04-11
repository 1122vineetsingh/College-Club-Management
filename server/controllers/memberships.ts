import { storage } from '../storage';
import type { InsertMembership, Membership } from '@shared/schema';

export async function getMembershipsByUser(userId: string): Promise<Membership[]> {
  return storage.getMembershipsByUser(userId);
}

export async function getMembershipsByClub(clubId: string): Promise<Membership[]> {
  return storage.getMembershipsByClub(clubId);
}

export async function getPendingMemberships(): Promise<any[]> {
  return storage.getPendingMemberships();
}

export async function getApprovedMemberships(): Promise<any[]> {
  return storage.getApprovedMemberships();
}

export async function createMembership(data: InsertMembership): Promise<Membership> {
  return storage.createMembership(data);
}

export async function updateMembership(id: string, updates: Partial<Membership>): Promise<Membership | undefined> {
  return storage.updateMembership(id, updates);
}
