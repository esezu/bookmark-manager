import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../utils/hash.js';

export async function getUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).all();
}

export async function getUserById(id: number) {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, id)).get();
}

export async function updateUser(id: number, data: {
  username?: string;
  email?: string;
  role?: string;
  password?: string;
}) {
  const updateData: any = { ...data };
  
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }
  
  if (!data.password) {
    delete updateData.password;
  }
  
  db.update(users).set(updateData).where(eq(users.id, id)).run();
  
  return getUserById(id);
}

export async function deleteUser(id: number) {
  db.delete(users).where(eq(users.id, id)).run();
  return true;
}
