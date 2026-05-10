import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').unique(),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  parentId: integer('parent_id'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const bookmarks = sqliteTable('bookmarks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').references(() => categories.id),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  favicon: text('favicon'),
  altUrl: text('alt_url'),
  isPrivate: integer('is_private').default(0),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP')
});

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  color: text('color').default('#3b82f6'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP')
});

export const bookmarkTags = sqliteTable('bookmark_tags', {
  bookmarkId: integer('bookmark_id').notNull().references(() => bookmarks.id),
  tagId: integer('tag_id').notNull().references(() => tags.id)
});

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  bookmarks: many(bookmarks),
  tags: many(tags)
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id]
  }),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  bookmarks: many(bookmarks)
}));

export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [bookmarks.categoryId],
    references: [categories.id]
  }),
  bookmarkTags: many(bookmarkTags)
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id]
  }),
  bookmarkTags: many(bookmarkTags)
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id]
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id]
  })
}));
