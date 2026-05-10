import { Hono } from 'hono';
import { z } from 'zod';
import * as tagService from '../services/tag.service.js';
import { success, error, notFound } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

const tagRoutes = new Hono();

tagRoutes.use('/*', authMiddleware);

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

const updateTagSchema = createTagSchema.partial();

tagRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const tags = await tagService.getTags(userId);
  return success(c, tags);
});

tagRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  const tag = await tagService.getTagById(id, userId);
  if (!tag) {
    return notFound(c, 'Tag not found');
  }
  
  return success(c, tag);
});

tagRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const parsed = createTagSchema.parse(body);
    const tag = await tagService.createTag({
      userId,
      name: parsed.name,
      color: parsed.color
    });
    
    return success(c, tag, '创建成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

tagRoutes.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  try {
    const parsed = updateTagSchema.parse(body);
    const tag = await tagService.updateTag(id, userId, {
      name: parsed.name,
      color: parsed.color
    });
    
    if (!tag) {
      return notFound(c, 'Tag not found');
    }
    
    return success(c, tag, '更新成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

tagRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  await tagService.deleteTag(id, userId);
  return success(c, null, '删除成功');
});

export { tagRoutes };
