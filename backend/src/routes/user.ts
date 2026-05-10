import { Hono } from 'hono';
import { z } from 'zod';
import * as userService from '../services/user.service.js';
import { success, error, notFound, forbidden } from '../utils/response.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const userRoutes = new Hono();

userRoutes.use('/*', authMiddleware);

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'user']).optional(),
  password: z.string().min(6).max(100).optional()
});

userRoutes.get('/', adminMiddleware, async (c) => {
  const users = await userService.getUsers();
  return success(c, users);
});

userRoutes.get('/:id', async (c) => {
  const currentUserId = c.get('userId');
  const currentRole = c.get('role');
  const id = parseInt(c.req.param('id'));
  
  if (currentRole !== 'admin' && currentUserId !== id) {
    return forbidden(c, 'Cannot access other user info');
  }
  
  const user = await userService.getUserById(id);
  if (!user) {
    return notFound(c, 'User not found');
  }
  
  return success(c, user);
});

userRoutes.put('/:id', async (c) => {
  const currentUserId = c.get('userId');
  const currentRole = c.get('role');
  const id = parseInt(c.req.param('id'));
  
  if (currentRole !== 'admin' && currentUserId !== id) {
    return forbidden(c, 'Cannot modify other user');
  }
  
  const body = await c.req.json();
  
  try {
    const parsed = updateUserSchema.parse(body);
    
    if (parsed.role && currentRole !== 'admin') {
      return forbidden(c, 'Only admin can change role');
    }
    
    const user = await userService.updateUser(id, parsed);
    if (!user) {
      return notFound(c, 'User not found');
    }
    
    return success(c, user, '更新成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

userRoutes.delete('/:id', adminMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  
  await userService.deleteUser(id);
  return success(c, null, '删除成功');
});

export { userRoutes };
