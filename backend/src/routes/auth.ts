import { Hono } from 'hono';
import { z } from 'zod';
import { register, login } from '../services/auth.service.js';
import { success, error } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { strictRateLimiter, authRateLimiter } from '../middleware/rate-limit.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const authRoutes = new Hono();

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文'),
  password: z.string()
    .min(8, '密码至少8个字符')
    .max(100, '密码最多100个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      '密码必须包含大小写字母和数字'
    ),
  email: z.string().email('请输入有效的邮箱地址').optional()
}).refine(
  (data) => strongPasswordRegex.test(data.password),
  {
    message: '密码必须包含至少一个大小写字母、一个数字和一个特殊字符（@$!%*?&）',
    path: ['password']
  }
);

const loginSchema = z.object({
  username: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string()
}).refine((data) => data.username || data.email, {
  message: '请输入用户名或邮箱'
});

authRoutes.post('/register', strictRateLimiter, async (c) => {
  const body = await c.req.json();
  
  try {
    const parsed = registerSchema.parse(body);
    const user = await register(parsed.username, parsed.password, parsed.email);
    return success(c, user, '注册成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

authRoutes.post('/login', authRateLimiter, async (c) => {
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