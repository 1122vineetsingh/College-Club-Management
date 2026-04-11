import { storage } from '../storage';
import type { InsertSystemSettings, SystemSettings } from '@shared/schema';

export async function getSystemSettings(): Promise<SystemSettings> {
  return storage.getSystemSettings();
}

export async function updateSystemSettings(data: InsertSystemSettings, updatedBy: string): Promise<SystemSettings> {
  return storage.updateSystemSettings(data, updatedBy);
}

export async function getDashboardStats() {
  return storage.getDashboardStats();
}
