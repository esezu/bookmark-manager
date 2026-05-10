import { db } from '../db/index.js';
import { tags, bookmarkTags } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface CreateTagInput {
  userId: number;
  name: string;
  color?: string;
}

export async function createTag(input: CreateTagInput) {
  const result = db.insert(tags).values({
    userId: input.userId,
    name: input.name,
    color: input.color || '#3b82f6'
  }).returning().get();
  
  return result;
}

export async function updateTag(id: number, userId: number, data: {
  name?: string;
  color?: string;
}) {
  db.update(tags)
    .set(data)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .run();
  
  return getTagById(id, userId);
}

export async function deleteTag(id: number, userId: number) {
  db.delete(bookmarkTags).where(eq(bookmarkTags.tagId, id)).run();
  db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId))).run();
  return true;
}

export async function getTagById(id: number, userId: number) {
  return db.select().from(tags)
    .where(and(eq(tags.id, id), eq(tags.userId, userId)))
    .get();
}

export async function getTags(userId: number) {
  return db.select().from(tags)
    .where(eq(tags.userId, userId))
    .all();
}
