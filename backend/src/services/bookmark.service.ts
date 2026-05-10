import { db } from '../db/index.js';
import { bookmarks, categories, tags, bookmarkTags } from '../db/schema.js';
import { eq, and, like, or, desc } from 'drizzle-orm';

interface CreateBookmarkInput {
  userId: number;
  categoryId?: number;
  title: string;
  url: string;
  description?: string;
  altUrl?: string;
  isPrivate?: boolean;
  tagIds?: number[];
}

interface UpdateBookmarkInput extends Partial<CreateBookmarkInput> {
  id: number;
  userId: number;
}

export async function createBookmark(input: CreateBookmarkInput) {
  const { tagIds, ...bookmarkData } = input;
  
  const result = db.insert(bookmarks).values({
    ...bookmarkData,
    isPrivate: bookmarkData.isPrivate ? 1 : 0
  }).returning().get();
  
  if (tagIds && tagIds.length > 0) {
    for (const tagId of tagIds) {
      db.insert(bookmarkTags).values({
        bookmarkId: result.id,
        tagId
      }).run();
    }
  }
  
  return getBookmarkById(result.id, input.userId);
}

export async function updateBookmark(input: UpdateBookmarkInput) {
  const { id, userId, tagIds, ...updateData } = input;
  
  db.update(bookmarks)
    .set({
      ...updateData,
      isPrivate: updateData.isPrivate !== undefined ? (updateData.isPrivate ? 1 : 0) : undefined,
      updatedAt: new Date().toISOString()
    })
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .run();
  
  if (tagIds !== undefined) {
    db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id)).run();
    for (const tagId of tagIds) {
      db.insert(bookmarkTags).values({
        bookmarkId: id,
        tagId
      }).run();
    }
  }
  
  return getBookmarkById(id, userId);
}

export async function deleteBookmark(id: number, userId: number) {
  db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id)).run();
  db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId))).run();
  return true;
}

export async function getBookmarkById(id: number, userId: number) {
  const bookmark = db.select().from(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .get();
  
  if (!bookmark) return null;
  
  const category = bookmark.categoryId 
    ? db.select().from(categories).where(eq(categories.id, bookmark.categoryId)).get()
    : null;
  
  const bookmarkTagRecords = db.select().from(bookmarkTags)
    .where(eq(bookmarkTags.bookmarkId, id))
    .all();
  
  const tagList = bookmarkTagRecords.map(bt => 
    db.select().from(tags).where(eq(tags.id, bt.tagId)).get()
  ).filter(Boolean);
  
  return {
    ...bookmark,
    category: category ? { id: category.id, name: category.name } : null,
    tags: tagList
  };
}

export async function getBookmarks(userId: number, options: {
  categoryId?: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { categoryId, keyword, page = 1, pageSize = 20 } = options;
  
  let allBookmarks;
  
  if (keyword) {
    const keywordPattern = `%${keyword}%`;
    allBookmarks = db.select().from(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        or(
          like(bookmarks.title, keywordPattern),
          like(bookmarks.url, keywordPattern)
        )
      ))
      .orderBy(desc(bookmarks.createdAt))
      .all();
  } else if (categoryId) {
    allBookmarks = db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.categoryId, categoryId)))
      .orderBy(desc(bookmarks.createdAt))
      .all();
  } else {
    allBookmarks = db.select().from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt))
      .all();
  }
  
  const total = allBookmarks.length;
  const offset = (page - 1) * pageSize;
  const list = allBookmarks.slice(offset, offset + pageSize);
  
  const result = list.map(bookmark => {
    const category = bookmark.categoryId 
      ? db.select().from(categories).where(eq(categories.id, bookmark.categoryId)).get()
      : null;
    
    const bookmarkTagRecords = db.select().from(bookmarkTags)
      .where(eq(bookmarkTags.bookmarkId, bookmark.id))
      .all();
    
    const tagList = bookmarkTagRecords.map(bt => 
      db.select().from(tags).where(eq(tags.id, bt.tagId)).get()
    ).filter(Boolean);
    
    return {
      ...bookmark,
      category: category ? { id: category.id, name: category.name } : null,
      tags: tagList
    };
  });
  
  return { list: result, total, page, pageSize };
}
