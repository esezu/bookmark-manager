import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

export async function register(username: string, password: string, email?: string) {
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  const result = db.insert(users).values({
    username,
    password: hashedPassword,
    email,
    role: 'user'
  }).returning().get();
  
  return {
    id: result.id,
    username: result.username,
    role: result.role
  };
}

export async function login(username: string, password: string) {
  const user = db.select().from(users).where(eq(users.username, username)).get();
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
