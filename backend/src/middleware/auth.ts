import { Context, Next } from 'hono';
import { verifyToken } from '../services/auth.service.js';
import { unauthorized } from '../utils/response.js';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(c, 'Missing or invalid authorization header');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    c.set('userId', payload.userId);
    c.set('username', payload.username);
    c.set('role', payload.role);
    await next();
  } catch (err) {
    return unauthorized(c, 'Invalid token');
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const role = c.get('role');
  if (role !== 'admin') {
    return unauthorized(c, 'Admin access required');
  }
  await next();
}
