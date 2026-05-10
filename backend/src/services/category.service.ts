import { db } from '../db/index.js';
import { categories, bookmarks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface CreateCategoryInput {
  userId: number;
  name: string;
  parentId?: number;
  sortOrder?: number;
}

export async function createCategory(input: CreateCategoryInput) {
  const result = db.insert(categories).values({
    userId: input.userId,
    name: input.name,
    parentId: input.parentId || null,
    sortOrder: input.sortOrder || 0
  }).returning().get();
  
  return result;
}

export async function updateCategory(id: number, userId: number, data: {
  name?: string;
  parentId?: number;
  sortOrder?: number;
}) {
  db.update(categories)
    .set(data)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .run();
  
  return getCategoryById(id, userId);
}

export async function deleteCategory(id: number, userId: number) {
  db.update(bookmarks)
    .set({ categoryId: null })
    .where(and(eq(bookmarks.categoryId, id), eq(bookmarks.userId, userId)))
    .run();
  
  db.delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .run();
  
  return true;
}

export async function getCategoryById(id: number, userId: number) {
  return db.select().from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .get();
}

export async function getCategories(userId: number) {
  const allCategories = db.select().from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.sortOrder)
    .all();
  
  const categoryWithCount = allCategories.map(cat => {
    const count = db.select().from(bookmarks)
      .where(and(eq(bookmarks.categoryId, cat.id), eq(bookmarks.userId, userId)))
      .all()
      .length;
    
    return {
      ...cat,
      bookmark_count: count
    };
  });
  
  const buildTree = (parentId: number | null): any[] => {
    return categoryWithCount
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: buildTree(cat.id)
      }));
  };
  
  return buildTree(null);
}
