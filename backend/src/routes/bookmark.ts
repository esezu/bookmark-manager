import { Hono } from 'hono';
import { z } from 'zod';
import * as bookmarkService from '../services/bookmark.service.js';
import { success, error, notFound } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

const bookmarkRoutes = new Hono();

bookmarkRoutes.use('/*', authMiddleware);

const createBookmarkSchema = z.object({
  category_id: z.number().optional(),
  title: z.string().min(1).max(200),
  url: z.string(),
  description: z.string().optional(),
  alt_url: z.string().optional(),
  is_private: z.boolean().default(false),
  tag_ids: z.array(z.number()).optional()
});

const updateBookmarkSchema = createBookmarkSchema.partial();

bookmarkRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const categoryId = c.req.query('category_id');
  const keyword = c.req.query('keyword');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('page_size') || '20');
  
  const result = await bookmarkService.getBookmarks(userId, {
    categoryId: categoryId ? parseInt(categoryId) : undefined,
    keyword,
    page,
    pageSize
  });
  
  return success(c, result);
});

bookmarkRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  const bookmark = await bookmarkService.getBookmarkById(id, userId);
  if (!bookmark) {
    return notFound(c, 'Bookmark not found');
  }
  
  return success(c, bookmark);
});

bookmarkRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const parsed = createBookmarkSchema.parse(body);
    const bookmark = await bookmarkService.createBookmark({
      userId,
      categoryId: parsed.category_id,
      title: parsed.title,
      url: parsed.url,
      description: parsed.description,
      altUrl: parsed.alt_url,
      isPrivate: parsed.is_private,
      tagIds: parsed.tag_ids
    });
    
    return success(c, bookmark, '创建成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

bookmarkRoutes.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  try {
    const parsed = updateBookmarkSchema.parse(body);
    const bookmark = await bookmarkService.updateBookmark({
      id,
      userId,
      categoryId: parsed.category_id,
      title: parsed.title,
      url: parsed.url,
      description: parsed.description,
      altUrl: parsed.alt_url,
      isPrivate: parsed.is_private,
      tagIds: parsed.tag_ids
    });
    
    return success(c, bookmark, '更新成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

bookmarkRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  await bookmarkService.deleteBookmark(id, userId);
  return success(c, null, '删除成功');
});

export { bookmarkRoutes };
