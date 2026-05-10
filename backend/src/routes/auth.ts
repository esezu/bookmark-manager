import { Hono } from 'hono';
import { z } from 'zod';
import { register, login } from '../services/auth.service.js';
import { success, error } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const authRoutes = new Hono();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  email: z.string().email().optional()
});

const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string()
}).refine((data) => data.username || data.email, {
  message: 'Either username or email is required'
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json();
  
  try {
    const parsed = loginSchema.parse(body);
    const result = await login(parsed.username || parsed.email || '', parsed.password);
    return success(c, result, '登录成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

authRoutes.post('/logout', authMiddleware, async (c) => {
  return success(c, null, '登出成功');
});

authRoutes.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const user = db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, userId)).get();
  
  if (!user) {
    return error(c, 'User not found', 404);
  }
  
  return success(c, user);
});

export { authRoutes };
