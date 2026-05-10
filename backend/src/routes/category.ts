import { Hono } from 'hono';
import { z } from 'zod';
import * as categoryService from '../services/category.service.js';
import { success, error, notFound } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';

const categoryRoutes = new Hono();

categoryRoutes.use('/*', authMiddleware);

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  parent_id: z.number().optional(),
  sort_order: z.number().optional()
});

const updateCategorySchema = createCategorySchema.partial();

categoryRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const categories = await categoryService.getCategories(userId);
  return success(c, categories);
});

categoryRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  const category = await categoryService.getCategoryById(id, userId);
  if (!category) {
    return notFound(c, 'Category not found');
  }
  
  return success(c, category);
});

categoryRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();
  
  try {
    const parsed = createCategorySchema.parse(body);
    const category = await categoryService.createCategory({
      userId,
      name: parsed.name,
      parentId: parsed.parent_id,
      sortOrder: parsed.sort_order
    });
    
    return success(c, category, '创建成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

categoryRoutes.put('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  try {
    const parsed = updateCategorySchema.parse(body);
    const category = await categoryService.updateCategory(id, userId, {
      name: parsed.name,
      parentId: parsed.parent_id,
      sortOrder: parsed.sort_order
    });
    
    if (!category) {
      return notFound(c, 'Category not found');
    }
    
    return success(c, category, '更新成功');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return error(c, err.errors[0].message);
    }
    return error(c, err.message);
  }
});

categoryRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  
  await categoryService.deleteCategory(id, userId);
  return success(c, null, '删除成功');
});

export { categoryRoutes };
