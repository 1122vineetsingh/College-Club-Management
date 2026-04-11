import { storage } from '../storage';
import type { InsertUser, User } from '@shared/schema';

export async function listUsers(): Promise<User[]> {
  return storage.getAllUsers();
}

export async function updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
  return storage.updateUser(id, data);
}

export async function deleteUser(id: string): Promise<boolean> {
  return storage.deleteUser(id);
}

export async function getUserById(id: string): Promise<User | undefined> {
  return storage.getUser(id);
}

export async function createUser(user: InsertUser): Promise<User> {
  return storage.createUser(user);
}
