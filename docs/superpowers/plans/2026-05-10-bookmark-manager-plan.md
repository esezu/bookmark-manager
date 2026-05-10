# 书签管理系统 (Bookmark Manager) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的书签管理系统，支持用户认证、书签管理、分类标签、导入导出、多用户管理等功能

**Architecture:** 采用前后端分离架构，后端使用 Bun + Hono.js + Drizzle ORM + SQLite3，前端使用 Vue3 + Naive UI + Tailwind CSS。通过 RESTful API 通信。

**Tech Stack:** Bun, Hono.js, Drizzle ORM, SQLite3, Vue3, Naive UI, Tailwind CSS, TypeScript, Vite

---

## 1. 项目结构

```
bookmark-manager/
├── backend/
│   ├── src/
│   │   ├── index.ts              # 入口
│   │   ├── app.ts                # Hono 应用
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── bookmark.ts
│   │   │   ├── category.ts
│   │   │   ├── tag.ts
│   │   │   ├── user.ts
│   │   │   └── import-export.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── cors.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── bookmark.service.ts
│   │   │   ├── category.service.ts
│   │   │   └── user.service.ts
│   │   └── utils/
│   │       ├── hash.ts
│   │       └── response.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── router/index.ts
│   │   ├── views/
│   │   ├── components/
│   │   ├── stores/
│   │   └── api/
│   └── package.json
└── docker-compose.yml
```

---

## 2. 任务分解

### Phase 1: 项目初始化

#### Task 1: 后端项目初始化

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/index.ts`
- Create: `backend/src/app.ts`

- [ ] **Step 1: 创建后端 package.json**

```json
{
  "name": "bookmark-manager-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun",
    "start": "bun run src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "@hono/zod-openapi": "^0.16.0",
    "drizzle-orm": "^0.38.0",
    "hono": "^4.6.0",
    "better-sqlite3": "^11.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/better-sqlite3": "^7.6.11",
    "@types/jsonwebtoken": "^9.0.7",
    "drizzle-kit": "^0.30.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/bookmarks.db'
  }
});
```

- [ ] **Step 4: 创建入口文件 src/index.ts**

```typescript
import { serve } from '@hono/node-server';
import { app } from './app';

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
```

- [ ] **Step 5: 创建 app.ts**

```typescript
import { Hono } from 'hono';
import { cors } from './middleware/cors';
import { authRoutes } from './routes/auth';
import { bookmarkRoutes } from './routes/bookmark';
import { categoryRoutes } from './routes/category';
import { tagRoutes } from './routes/tag';
import { userRoutes } from './routes/user';
import { importExportRoutes } from './routes/import-export';

export const app = new Hono();

app.use('*', cors);

app.get('/', (c) => c.json({ message: 'Bookmark Manager API' }));

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/bookmarks', bookmarkRoutes);
app.route('/api/v1/categories', categoryRoutes);
app.route('/api/v1/tags', tagRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1', importExportRoutes);
```

- [ ] **Step 6: 创建中间件 src/middleware/cors.ts**

```typescript
import { Context, Next } from 'hono';

export const cors = async (c: Context, next: Next) => {
  await next();
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};
```

#### Task 2: 数据库 Schema 创建

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/index.ts`

- [ ] **Step 1: 创建数据库 Schema src/db/schema.ts**

```typescript
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
```

- [ ] **Step 2: 创建数据库连接 src/db/index.ts**

```typescript
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const dbPath = './data/bookmarks.db';
const dbDir = dirname(dbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;
```

#### Task 3: 工具函数创建

**Files:**
- Create: `backend/src/utils/hash.ts`
- Create: `backend/src/utils/response.ts`

- [ ] **Step 1: 创建密码哈希工具 src/utils/hash.ts**

```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

- [ ] **Step 2: 创建响应工具 src/utils/response.ts**

```typescript
import { Context } from 'hono';

interface ResponseData {
  code: number;
  message: string;
  data?: any;
}

export function success(c: Context, data?: any, message = 'success') {
  return c.json<ResponseData>({
    code: 0,
    message,
    data
  });
}

export function error(c: Context, message: string, code = 1) {
  return c.json<ResponseData>({
    code,
    message
  }, 400);
}

export function unauthorized(c: Context, message = 'Unauthorized') {
  return c.json<ResponseData>({
    code: 401,
    message
  }, 401);
}

export function forbidden(c: Context, message = 'Forbidden') {
  return c.json<ResponseData>({
    code: 403,
    message
  }, 403);
}

export function notFound(c: Context, message = 'Not found') {
  return c.json<ResponseData>({
    code: 404,
    message
  }, 404);
}
```

#### Task 4: 认证中间件和服务

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/services/auth.service.ts`

- [ ] **Step 1: 创建认证中间件 src/middleware/auth.ts**

```typescript
import { Context, Next } from 'hono';
import { verifyToken } from '../services/auth.service';
import { unauthorized } from '../utils/response';

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
```

- [ ] **Step 2: 创建认证服务 src/services/auth.service.ts**

```typescript
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../utils/hash';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

interface TokenPayload {
  userId: number;
  username: string;
  role: string;
}

export async function register(username: string, password: string, email?: string) {
  const existing = db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    throw new Error('Username already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  const result = db.insert(users).values({
    username,
    password: hashedPassword,
    email,
    role: 'user'
  }).returning().get();
  
  return {
    id: result.id,
    username: result.username,
    role: result.role
  };
}

export async function login(username: string, password: string) {
  const user = db.select().from(users).where(eq(users.username, username)).get();
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });
  
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  };
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
```

#### Task 5: 认证路由

**Files:**
- Create: `backend/src/routes/auth.ts`

- [ ] **Step 1: 创建认证路由 src/routes/auth.ts**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import { register, login } from '../services/auth.service';
import { success, error } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const authRoutes = new Hono();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  email: z.string().email().optional()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json');
  
  try {
    const user = await register(body.username, body.password, body.email);
    return success(c, user, '注册成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const body = c.req.valid('json');
  
  try {
    const result = await login(body.username, body.password);
    return success(c, result, '登录成功');
  } catch (err: any) {
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
```

#### Task 6: 书签服务和路由

**Files:**
- Create: `backend/src/services/bookmark.service.ts`
- Create: `backend/src/routes/bookmark.ts`

- [ ] **Step 1: 创建书签服务 src/services/bookmark.service.ts**

```typescript
import { db } from '../db';
import { bookmarks, categories, tags, bookmarkTags } from '../db/schema';
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
}) {
  const { categoryId, keyword, page = 1, pageSize = 20 } = options;
  
  let query = db.select().from(bookmarks).where(eq(bookmarks.userId, userId));
  
  if (categoryId) {
    query = db.select().from(bookmarks)
      .where(and(eq(bookmarks.userId, userId), eq(bookmarks.categoryId, categoryId)));
  }
  
  if (keyword) {
    const keywordPattern = `%${keyword}%`;
    query = db.select().from(bookmarks)
      .where(and(
        eq(bookmarks.userId, userId),
        or(
          like(bookmarks.title, keywordPattern),
          like(bookmarks.url, keywordPattern),
          like(bookmarks.description, keywordPattern)
        )
      ));
  }
  
  const allBookmarks = query.orderBy(desc(bookmarks.createdAt)).all();
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
```

- [ ] **Step 2: 创建书签路由 src/routes/bookmark.ts**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import * as bookmarkService from '../services/bookmark.service';
import { success, error, notFound } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

const bookmarkRoutes = new Hono();

bookmarkRoutes.use('/*', authMiddleware);

const createBookmarkSchema = z.object({
  category_id: z.number().optional(),
  title: z.string().min(1).max(200),
  url: z.string().url(),
  description: z.string().optional(),
  alt_url: z.string().url().optional(),
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

bookmarkRoutes.post('/', zValidator('json', createBookmarkSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');
  
  try {
    const bookmark = await bookmarkService.createBookmark({
      userId,
      categoryId: body.category_id,
      title: body.title,
      url: body.url,
      description: body.description,
      altUrl: body.alt_url,
      isPrivate: body.is_private,
      tagIds: body.tag_ids
    });
    
    return success(c, bookmark, '创建成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

bookmarkRoutes.put('/:id', zValidator('json', updateBookmarkSchema), async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  
  try {
    const bookmark = await bookmarkService.updateBookmark({
      id,
      userId,
      categoryId: body.category_id,
      title: body.title,
      url: body.url,
      description: body.description,
      altUrl: body.alt_url,
      isPrivate: body.is_private,
      tagIds: body.tag_ids
    });
    
    return success(c, bookmark, '更新成功');
  } catch (err: any) {
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
```

#### Task 7: 分类服务和路由

**Files:**
- Create: `backend/src/services/category.service.ts`
- Create: `backend/src/routes/category.ts`

- [ ] **Step 1: 创建分类服务 src/services/category.service.ts**

```typescript
import { db } from '../db';
import { categories, bookmarks } from '../db/schema';
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
```

- [ ] **Step 2: 创建分类路由 src/routes/category.ts**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import * as categoryService from '../services/category.service';
import { success, error, notFound } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

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

categoryRoutes.post('/', zValidator('json', createCategorySchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');
  
  try {
    const category = await categoryService.createCategory({
      userId,
      name: body.name,
      parentId: body.parent_id,
      sortOrder: body.sort_order
    });
    
    return success(c, category, '创建成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

categoryRoutes.put('/:id', zValidator('json', updateCategorySchema), async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  
  try {
    const category = await categoryService.updateCategory(id, userId, {
      name: body.name,
      parentId: body.parent_id,
      sortOrder: body.sort_order
    });
    
    if (!category) {
      return notFound(c, 'Category not found');
    }
    
    return success(c, category, '更新成功');
  } catch (err: any) {
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
```

#### Task 8: 标签服务和路由

**Files:**
- Create: `backend/src/services/tag.service.ts`
- Create: `backend/src/routes/tag.ts`

- [ ] **Step 1: 创建标签服务 src/services/tag.service.ts**

```typescript
import { db } from '../db';
import { tags, bookmarkTags } from '../db/schema';
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
```

- [ ] **Step 2: 创建标签路由 src/routes/tag.ts**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import * as tagService from '../services/tag.service';
import { success, error, notFound } from '../utils/response';
import { authMiddleware } from '../middleware/auth';

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

tagRoutes.post('/', zValidator('json', createTagSchema), async (c) => {
  const userId = c.get('userId');
  const body = c.req.valid('json');
  
  try {
    const tag = await tagService.createTag({
      userId,
      name: body.name,
      color: body.color
    });
    
    return success(c, tag, '创建成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

tagRoutes.put('/:id', zValidator('json', updateTagSchema), async (c) => {
  const userId = c.get('userId');
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  
  try {
    const tag = await tagService.updateTag(id, userId, {
      name: body.name,
      color: body.color
    });
    
    if (!tag) {
      return notFound(c, 'Tag not found');
    }
    
    return success(c, tag, '更新成功');
  } catch (err: any) {
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
```

#### Task 9: 用户管理路由

**Files:**
- Create: `backend/src/services/user.service.ts`
- Create: `backend/src/routes/user.ts`

- [ ] **Step 1: 创建用户服务 src/services/user.service.ts**

```typescript
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../utils/hash';

export async function getUsers() {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).all();
}

export async function getUserById(id: number) {
  return db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, id)).get();
}

export async function updateUser(id: number, data: {
  username?: string;
  email?: string;
  role?: string;
  password?: string;
}) {
  const updateData: any = { ...data };
  
  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }
  
  if (!data.password) {
    delete updateData.password;
  }
  
  db.update(users).set(updateData).where(eq(users.id, id)).run();
  
  return getUserById(id);
}

export async function deleteUser(id: number) {
  db.delete(users).where(eq(users.id, id)).run();
  return true;
}
```

- [ ] **Step 2: 创建用户路由 src/routes/user.ts**

```typescript
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-openapi';
import * as userService from '../services/user.service';
import { success, error, notFound, forbidden } from '../utils/response';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

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

userRoutes.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const currentUserId = c.get('userId');
  const currentRole = c.get('role');
  const id = parseInt(c.req.param('id'));
  
  if (currentRole !== 'admin' && currentUserId !== id) {
    return forbidden(c, 'Cannot modify other user');
  }
  
  const body = c.req.valid('json');
  
  if (body.role && currentRole !== 'admin') {
    return forbidden(c, 'Only admin can change role');
  }
  
  try {
    const user = await userService.updateUser(id, body);
    if (!user) {
      return notFound(c, 'User not found');
    }
    
    return success(c, user, '更新成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

userRoutes.delete('/:id', adminMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'));
  
  await userService.deleteUser(id);
  return success(c, null, '删除成功');
});

export { userRoutes };
```

#### Task 10: 导入导出路由

**Files:**
- Create: `backend/src/routes/import-export.ts`

- [ ] **Step 1: 创建导入导出路由 src/routes/import-export.ts**

```typescript
import { Hono } from 'hono';
import { success, error } from '../utils/response';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db';
import { bookmarks, categories } from '../db/schema';
import { eq } from 'drizzle-orm';

const importExportRoutes = new Hono();

importExportRoutes.use('/*', authMiddleware);

importExportRoutes.post('/import', async (c) => {
  const userId = c.get('userId');
  
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    
    if (!file) {
      return error(c, 'No file uploaded');
    }
    
    const text = await file.text();
    const parser = new BookmarkParser(userId);
    const result = await parser.parse(text);
    
    return success(c, result, '导入成功');
  } catch (err: any) {
    return error(c, err.message);
  }
});

importExportRoutes.get('/export', async (c) => {
  const userId = c.get('userId');
  const format = c.req.query('format') || 'html';
  
  const userBookmarks = db.select().from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .all();
  
  const userCategories = db.select().from(categories)
    .where(eq(categories.userId, userId))
    .all();
  
  if (format === 'json') {
    return c.json({
      code: 0,
      data: {
        categories: userCategories,
        bookmarks: userBookmarks
      }
    });
  }
  
  const html = generateHtmlExport(userCategories, userBookmarks);
  return c.html(html);
});

function generateHtmlExport(categories: any[], bookmarks: any[]) {
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>`;
  
  for (const category of categories.filter(c => !c.parentId)) {
    html += `\n    <DT><H3>${escapeHtml(category.name)}</H3>`;
    html += `\n    <DL><p>`;
    
    const childCategories = categories.filter(c => c.parentId === category.id);
    for (const child of childCategories) {
      html += `\n        <DT><H3>${escapeHtml(child.name)}</H3>`;
      html += `\n        <DL><p>`;
      
      const categoryBookmarks = bookmarks.filter(b => b.categoryId === child.id);
      for (const bookmark of categoryBookmarks) {
        html += `\n            <DT><A HREF="${escapeHtml(bookmark.url)}">${escapeHtml(bookmark.title)}</A>`;
      }
      
      html += `\n        </DL><p>`;
    }
    
    const categoryBookmarks = bookmarks.filter(b => b.categoryId === category.id);
    for (const bookmark of categoryBookmarks) {
      html += `\n        <DT><A HREF="${escapeHtml(bookmark.url)}">${escapeHtml(bookmark.title)}</A>`;
    }
    
    html += `\n    </DL><p>`;
  }
  
  const uncategorizedBookmarks = bookmarks.filter(b => !b.categoryId);
  for (const bookmark of uncategorizedBookmarks) {
    html += `\n    <DT><A HREF="${escapeHtml(bookmark.url)}">${escapeHtml(bookmark.title)}</A>`;
  }
  
  html += `\n</DL>`;
  
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class BookmarkParser {
  private userId: number;
  
  constructor(userId: number) {
    this.userId = userId;
  }
  
  async parse(html: string): Promise<{ total: number; success: number; failed: number }> {
    let total = 0;
    let success = 0;
    let failed = 0;
    
    const linkRegex = /<A HREF="([^"]+)".*?>([^<]+)<\/A>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      total++;
      try {
        const url = match[1];
        const title = match[2].trim();
        
        db.insert(bookmarks).values({
          userId: this.userId,
          title,
          url,
          description: ''
        }).run();
        
        success++;
      } catch (err) {
        failed++;
      }
    }
    
    return { total, success, failed };
  }
}

export { importExportRoutes };
```

---

### Phase 2: 前端项目初始化

#### Task 11: 前端项目结构

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`

- [ ] **Step 1: 创建前端 package.json**

```json
{
  "name": "bookmark-manager-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.0",
    "vue-router": "^4.4.0",
    "pinia": "^2.2.0",
    "naive-ui": "^2.40.0",
    "@vicons/ionicons5": "^0.12.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vue-tsc": "^2.1.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>书签管理器</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 Tailwind 配置**

```typescript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```javascript
// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 创建 main.ts**

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive)

app.mount('#app')
```

- [ ] **Step 7: 创建样式文件 src/styles/main.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: 创建 App.vue**

```vue
<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <router-view />
        </n-notification-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NDialogProvider, NNotificationProvider } from 'naive-ui'

const themeOverrides = {
  common: {
    primaryColor: '#3b82f6',
    primaryColorHover: '#60a5fa',
    primaryColorPressed: '#2563eb',
  }
}
</script>
```

#### Task 12: 路由配置

**Files:**
- Create: `frontend/src/router/index.ts`

- [ ] **Step 1: 创建路由配置 src/router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    component: () => import('@/views/Login.vue'),
    meta: { guest: true }
  },
  {
    path: '/register',
    component: () => import('@/views/Register.vue'),
    meta: { guest: true }
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/Layout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        component: () => import('@/views/admin/Dashboard.vue')
      },
      {
        path: 'bookmarks',
        component: () => import('@/views/admin/Bookmarks.vue')
      },
      {
        path: 'categories',
        component: () => import('@/views/admin/Categories.vue')
      },
      {
        path: 'tags',
        component: () => import('@/views/admin/Tags.vue')
      },
      {
        path: 'users',
        component: () => import('@/views/admin/Users.vue')
      },
      {
        path: 'settings',
        component: () => import('@/views/admin/Settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next('/')
  } else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router
```

#### Task 13: Pinia Stores

**Files:**
- Create: `frontend/src/stores/auth.ts`
- Create: `frontend/src/stores/bookmark.ts`

- [ ] **Step 1: 创建认证 Store src/stores/auth.ts**

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isLoggedIn = computed(() => !!token.value)
  
  async function login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password })
    if (response.data.code === 0) {
      token.value = response.data.data.token
      user.value = response.data.data.user
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      return true
    }
    throw new Error(response.data.message)
  }
  
  async function register(username: string, password: string, email?: string) {
    const response = await api.post('/auth/register', { username, password, email })
    if (response.data.code === 0) {
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/me')
      if (response.data.code === 0) {
        user.value = response.data.data
        localStorage.setItem('user', JSON.stringify(user.value))
      }
    } catch (error) {
      logout()
    }
  }
  
  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser
  }
})
```

- [ ] **Step 2: 创建书签 Store src/stores/bookmark.ts**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/api'

export const useBookmarkStore = defineStore('bookmark', () => {
  const bookmarks = ref<any[]>([])
  const total = ref(0)
  const loading = ref(false)
  
  async function fetchBookmarks(params: {
    category_id?: number
    keyword?: string
    page?: number
    page_size?: number
  } = {}) {
    loading.value = true
    try {
      const response = await api.get('/bookmarks', { params })
      if (response.data.code === 0) {
        bookmarks.value = response.data.data.list
        total.value = response.data.data.total
      }
    } finally {
      loading.value = false
    }
  }
  
  async function createBookmark(data: {
    category_id?: number
    title: string
    url: string
    description?: string
    alt_url?: string
    is_private?: boolean
    tag_ids?: number[]
  }) {
    const response = await api.post('/bookmarks', data)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  async function updateBookmark(id: number, data: any) {
    const response = await api.put(`/bookmarks/${id}`, data)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return response.data.data
    }
    throw new Error(response.data.message)
  }
  
  async function deleteBookmark(id: number) {
    const response = await api.delete(`/bookmarks/${id}`)
    if (response.data.code === 0) {
      await fetchBookmarks()
      return true
    }
    throw new Error(response.data.message)
  }
  
  return {
    bookmarks,
    total,
    loading,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark
  }
})
```

#### Task 14: API 配置

**Files:**
- Create: `frontend/src/api/index.ts`

- [ ] **Step 1: 创建 API 配置 src/api/index.ts**

```typescript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

#### Task 15: 页面组件

**Files:**
- Create: `frontend/src/views/Login.vue`
- Create: `frontend/src/views/Register.vue`
- Create: `frontend/src/views/Home.vue`

- [ ] **Step 1: 创建登录页面 src/views/Login.vue**

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <n-card class="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800">书签管理器</h1>
          <p class="text-gray-500 mt-2">登录您的账户</p>
        </div>
      </template>
      
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        
        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="form.password"
            type="password"
            placeholder="请输入密码"
            @keydown.enter="handleLogin"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-button type="primary" block :loading="loading" @click="handleLogin">
          登录
        </n-button>
        <div class="text-center mt-4">
          <n-button text @click="$router.push('/register')">
            还没有账户？立即注册
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const rules = {
  username: { required: true, message: '请输入用户名', trigger: 'blur' },
  password: { required: true, message: '请输入密码', trigger: 'blur' }
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await authStore.login(form.value.username, form.value.password)
    message.success('登录成功')
    router.push('/')
  } catch (error: any) {
    message.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 2: 创建注册页面 src/views/Register.vue**

```vue
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
    <n-card class="w-full max-w-md" :bordered="false">
      <template #header>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-800">书签管理器</h1>
          <p class="text-gray-500 mt-2">创建新账户</p>
        </div>
      </template>
      
      <n-form ref="formRef" :model="form" :rules="rules">
        <n-form-item path="username" label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" />
        </n-form-item>
        
        <n-form-item path="email" label="邮箱">
          <n-input v-model:value="form.email" placeholder="请输入邮箱（可选）" />
        </n-form-item>
        
        <n-form-item path="password" label="密码">
          <n-input v-model:value="form.password" type="password" placeholder="请输入密码" />
        </n-form-item>
        
        <n-form-item path="confirmPassword" label="确认密码">
          <n-input
            v-model:value="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
          />
        </n-form-item>
      </n-form>
      
      <template #footer>
        <n-button type="primary" block :loading="loading" @click="handleRegister">
          注册
        </n-button>
        <div class="text-center mt-4">
          <n-button text @click="$router.push('/login')">
            已有账户？立即登录
          </n-button>
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule: any, value: string) => {
  return value === form.value.password || '两次输入的密码不一致'
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  email: { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
    loading.value = true
    await authStore.register(form.value.username, form.value.password, form.value.email)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (error: any) {
    message.error(error.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 3: 创建首页 src/views/Home.vue**

```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-800">书签管理器</h1>
        <div class="flex items-center space-x-4">
          <n-input
            v-model:value="searchKeyword"
            placeholder="搜索书签..."
            clearable
            @keydown.enter="handleSearch"
          >
            <template #prefix>
              <n-icon><Search /></n-icon>
            </template>
          </n-input>
          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-button text>
              {{ authStore.user?.username }}
              <n-icon><ChevronDown /></n-icon>
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex gap-6">
        <aside class="w-64 flex-shrink-0">
          <n-card>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="font-semibold">分类</span>
                <n-button text size="small" @click="$router.push('/admin/categories')">
                  <n-icon><Settings /></n-icon>
                </n-button>
              </div>
            </template>
            <n-menu
              v-model:value="activeCategoryId"
              :options="categoryOptions"
              @update:value="handleCategoryChange"
            />
          </n-card>
        </aside>
        
        <div class="flex-1">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <n-card
              v-for="bookmark in bookmarkStore.bookmarks"
              :key="bookmark.id"
              hoverable
              class="cursor-pointer"
              @click="openBookmark(bookmark.url)"
            >
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <img
                    v-if="bookmark.favicon"
                    :src="bookmark.favicon"
                    class="w-6 h-6"
                    @error="handleFaviconError"
                  />
                  <n-icon v-else size="24" color="#666"><Link /></n-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-medium text-gray-800 truncate">{{ bookmark.title }}</h3>
                  <p class="text-sm text-gray-500 truncate">{{ bookmark.url }}</p>
                  <div v-if="bookmark.description" class="text-xs text-gray-400 mt-1 truncate">
                    {{ bookmark.description }}
                  </div>
                </div>
              </div>
              <template #action v-if="authStore.user?.role === 'admin'">
                <div class="flex justify-end space-x-2">
                  <n-button text size="small" @click.stop="editBookmark(bookmark)">
                    <n-icon><Create /></n-icon>
                  </n-button>
                  <n-button text size="small" @click.stop="deleteBookmarkConfirm(bookmark.id)">
                    <n-icon><Trash /></n-icon>
                  </n-button>
                </div>
              </template>
            </n-card>
          </div>
          
          <div v-if="bookmarkStore.bookmarks.length === 0" class="text-center py-12">
            <n-empty description="暂无书签">
              <template #extra>
                <n-button type="primary" @click="showAddModal = true">添加书签</n-button>
              </template>
            </n-empty>
          </div>
        </div>
      </div>
    </main>
    
    <BookmarkModal
      v-model:show="showAddModal"
      :bookmark="selectedBookmark"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard, NInput, NIcon, NDropdown, NButton, NMenu, NEmpty,
  useMessage, useDialog
} from 'naive-ui'
import { Search, ChevronDown, Link, Create, Trash, Settings } from '@vicons/ionicons5'
import { useAuthStore } from '@/stores/auth'
import { useBookmarkStore } from '@/stores/bookmark'
import api from '@/api'
import BookmarkModal from '@/components/bookmark/Modal.vue'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const authStore = useAuthStore()
const bookmarkStore = useBookmarkStore()

const searchKeyword = ref('')
const activeCategoryId = ref<number | null>(null)
const categories = ref<any[]>([])
const showAddModal = ref(false)
const selectedBookmark = ref<any>(null)

const categoryOptions = computed(() => [
  { label: '全部书签', key: null },
  ...categories.value.map(c => ({
    label: `${c.name} (${c.bookmark_count})`,
    key: c.id
  }))
])

const userMenuOptions = [
  { label: '管理后台', key: 'admin' },
  { label: '退出登录', key: 'logout' }
]

async function fetchCategories() {
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function handleSearch() {
  bookmarkStore.fetchBookmarks({ keyword: searchKeyword.value })
}

function handleCategoryChange(categoryId: number | null) {
  activeCategoryId.value = categoryId
  bookmarkStore.fetchBookmarks({ category_id: categoryId || undefined })
}

function handleUserMenuSelect(key: string) {
  if (key === 'admin') {
    router.push('/admin')
  } else if (key === 'logout') {
    authStore.logout()
    router.push('/login')
  }
}

function openBookmark(url: string) {
  window.open(url, '_blank')
}

function editBookmark(bookmark: any) {
  selectedBookmark.value = bookmark
  showAddModal.value = true
}

function deleteBookmarkConfirm(id: number) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个书签吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await bookmarkStore.deleteBookmark(id)
        message.success('删除成功')
      } catch (error: any) {
        message.error(error.message || '删除失败')
      }
    }
  })
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedBookmark.value = null
  fetchCategories()
}

function handleFaviconError(e: Event) {
  (e.target as HTMLImageElement).style.display = 'none'
}

onMounted(async () => {
  await Promise.all([
    bookmarkStore.fetchBookmarks(),
    fetchCategories()
  ])
})
</script>
```

#### Task 16: 管理后台页面

**Files:**
- Create: `frontend/src/views/admin/Layout.vue`
- Create: `frontend/src/views/admin/Bookmarks.vue`
- Create: `frontend/src/views/admin/Categories.vue`
- Create: `frontend/src/views/admin/Tags.vue`
- Create: `frontend/src/views/admin/Users.vue`
- Create: `frontend/src/views/admin/Settings.vue`
- Create: `frontend/src/views/admin/Dashboard.vue`

- [ ] **Step 1: 创建管理后台布局 src/views/admin/Layout.vue**

```vue
<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-8">
          <h1 class="text-xl font-bold text-gray-800">书签管理器 - 管理后台</h1>
          <nav class="flex space-x-4">
            <router-link
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              class="text-gray-600 hover:text-gray-900"
              active-class="text-blue-600 font-medium"
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>
        <div class="flex items-center space-x-4">
          <n-button text @click="$router.push('/')">返回前台</n-button>
          <n-button text @click="handleLogout">退出登录</n-button>
        </div>
      </div>
    </header>
    
    <main class="max-w-7xl mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { NButton, useMessage } from 'naive-ui'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const menuItems = [
  { label: '仪表盘', path: '/admin' },
  { label: '书签管理', path: '/admin/bookmarks' },
  { label: '分类管理', path: '/admin/categories' },
  { label: '标签管理', path: '/admin/tags' },
  { label: '用户管理', path: '/admin/users' },
  { label: '系统设置', path: '/admin/settings' }
]

function handleLogout() {
  authStore.logout()
  message.success('已退出登录')
  router.push('/login')
}
</script>
```

- [ ] **Step 2: 创建仪表盘页面 src/views/admin/Dashboard.vue**

```vue
<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">仪表盘</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600">{{ stats.totalBookmarks }}</div>
          <div class="text-gray-500">书签总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600">{{ stats.totalCategories }}</div>
          <div class="text-gray-500">分类总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-purple-600">{{ stats.totalTags }}</div>
          <div class="text-gray-500">标签总数</div>
        </div>
      </n-card>
      <n-card>
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600">{{ stats.totalUsers }}</div>
          <div class="text-gray-500">用户总数</div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NCard } from 'naive-ui'
import api from '@/api'

const stats = ref({
  totalBookmarks: 0,
  totalCategories: 0,
  totalTags: 0,
  totalUsers: 0
})

async function fetchStats() {
  try {
    const [bookmarksRes, categoriesRes, tagsRes, usersRes] = await Promise.all([
      api.get('/bookmarks', { params: { page_size: 1 } }),
      api.get('/categories'),
      api.get('/tags'),
      api.get('/users')
    ])
    
    stats.value = {
      totalBookmarks: bookmarksRes.data.data?.total || 0,
      totalCategories: Array.isArray(categoriesRes.data.data) ? categoriesRes.data.data.length : 0,
      totalTags: Array.isArray(tagsRes.data.data) ? tagsRes.data.data.length : 0,
      totalUsers: Array.isArray(usersRes.data.data) ? usersRes.data.data.length : 0
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

onMounted(fetchStats)
</script>
```

- [ ] **Step 3: 创建书签管理页面 src/views/admin/Bookmarks.vue**

```vue
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">书签管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加书签</n-button>
    </div>
    
    <n-card class="mb-4">
      <n-space>
        <n-input v-model:value="searchKeyword" placeholder="搜索书签..." clearable />
        <n-select
          v-model:value="filterCategoryId"
          :options="categoryOptions"
          placeholder="选择分类"
          clearable
          style="width: 200px"
        />
        <n-button @click="handleSearch">搜索</n-button>
        <n-button @click="handleReset">重置</n-button>
      </n-space>
    </n-card>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="bookmarkStore.bookmarks"
        :loading="bookmarkStore.loading"
        :pagination="pagination"
      />
    </n-card>
    
    <BookmarkModal
      v-model:show="showAddModal"
      :bookmark="selectedBookmark"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NInput, NButton, NSpace, NSelect, NDataTable, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Link, Create, Trash } from '@vicons/ionicons5'
import { useBookmarkStore } from '@/stores/bookmark'
import api from '@/api'
import BookmarkModal from '@/components/bookmark/Modal.vue'

const message = useMessage()
const bookmarkStore = useBookmarkStore()

const searchKeyword = ref('')
const filterCategoryId = ref<number | null>(null)
const categories = ref<any[]>([])
const showAddModal = ref(false)
const selectedBookmark = ref<any>(null)
const pagination = { pageSize: 20 }

const categoryOptions = ref<any[]>([])

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '标题', key: 'title', ellipsis: true },
  { title: 'URL', key: 'url', ellipsis: true },
  { title: '分类', key: 'category', render: (row) => row.category?.name || '-' },
  { title: '私有', key: 'is_private', render: (row) => h(NTag, { type: row.is_private ? 'error' : 'default' }, () => row.is_private ? '是' : '否') },
  { title: '创建时间', key: 'created_at', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editBookmark(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteBookmark(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

async function fetchCategories() {
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = response.data.data || []
      categoryOptions.value = [
        { label: '全部', value: null },
        ...categories.value.map(c => ({ label: c.name, value: c.id }))
      ]
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function handleSearch() {
  bookmarkStore.fetchBookmarks({
    keyword: searchKeyword.value || undefined,
    category_id: filterCategoryId.value || undefined
  })
}

function handleReset() {
  searchKeyword.value = ''
  filterCategoryId.value = null
  bookmarkStore.fetchBookmarks()
}

function editBookmark(bookmark: any) {
  selectedBookmark.value = bookmark
  showAddModal.value = true
}

async function deleteBookmark(id: number) {
  try {
    await bookmarkStore.deleteBookmark(id)
    message.success('删除成功')
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedBookmark.value = null
  handleSearch()
}

onMounted(async () => {
  await Promise.all([
    bookmarkStore.fetchBookmarks(),
    fetchCategories()
  ])
})
</script>
```

- [ ] **Step 4: 创建分类管理页面 src/views/admin/Categories.vue**

```vue
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">分类管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加分类</n-button>
    </div>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="categories"
        :loading="loading"
        :expandable="{ expandRow: false }"
        :row-key="(row: any) => row.id"
      />
    </n-card>
    
    <CategoryModal
      v-model:show="showAddModal"
      :category="selectedCategory"
      :categories="categories"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NIcon, NTag, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import api from '@/api'
import CategoryModal from '@/components/category/Modal.vue'

const message = useMessage()

const categories = ref<any[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const selectedCategory = ref<any>(null)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '书签数量', key: 'bookmark_count', width: 120 },
  { title: '排序', key: 'sort_order', width: 100 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editCategory(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteCategory(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

async function fetchCategories() {
  loading.value = true
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = flattenCategories(response.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    loading.value = false
  }
}

function flattenCategories(cats: any[], level = 0): any[] {
  let result: any[] = []
  for (const cat of cats) {
    result.push({ ...cat, _level: level })
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children, level + 1))
    }
  }
  return result
}

function editCategory(category: any) {
  selectedCategory.value = category
  showAddModal.value = true
}

async function deleteCategory(id: number) {
  try {
    await api.delete(`/categories/${id}`)
    message.success('删除成功')
    fetchCategories()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedCategory.value = null
  fetchCategories()
}

onMounted(fetchCategories)
</script>
```

- [ ] **Step 5: 创建标签管理页面 src/views/admin/Tags.vue**

```vue
<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">标签管理</h2>
      <n-button type="primary" @click="showAddModal = true">添加标签</n-button>
    </div>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="tags"
        :loading="loading"
      />
    </n-card>
    
    <TagModal
      v-model:show="showAddModal"
      :tag="selectedTag"
      @success="handleModalSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NIcon, NTag, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import api from '@/api'
import TagModal from '@/components/tag/Modal.vue'

const message = useMessage()

const tags = ref<any[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const selectedTag = ref<any>(null)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '名称', key: 'name' },
  { title: '颜色', key: 'color', render: (row) => h(NTag, { color: { color: row.color, textColor: '#fff' } }, () => row.color) },
  { title: '创建时间', key: 'created_at', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editTag(row) }, () => h(NIcon, () => h(Create))),
      h(NPopconfirm, {
        onPositiveClick: () => deleteTag(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      })
    ])
  }
]

async function fetchTags() {
  loading.value = true
  try {
    const response = await api.get('/tags')
    if (response.data.code === 0) {
      tags.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  } finally {
    loading.value = false
  }
}

function editTag(tag: any) {
  selectedTag.value = tag
  showAddModal.value = true
}

async function deleteTag(id: number) {
  try {
    await api.delete(`/tags/${id}`)
    message.success('删除成功')
    fetchTags()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

function handleModalSuccess() {
  showAddModal.value = false
  selectedTag.value = null
  fetchTags()
}

onMounted(fetchTags)
</script>
```

- [ ] **Step 6: 创建用户管理页面 src/views/admin/Users.vue**

```vue
<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">用户管理</h2>
    
    <n-card>
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
      />
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { NCard, NDataTable, NButton, NTag, NIcon, NPopconfirm, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Create, Trash } from '@vicons/ionicons5'
import api from '@/api'
import { useAuthStore } from '@/stores/auth'

const message = useMessage()
const authStore = useAuthStore()

const users = ref<any[]>([])
const loading = ref(false)

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 80 },
  { title: '用户名', key: 'username' },
  { title: '邮箱', key: 'email' },
  { title: '角色', key: 'role', render: (row) => h(NTag, { type: row.role === 'admin' ? 'error' : 'default' }, () => row.role === 'admin' ? '管理员' : '用户') },
  { title: '创建时间', key: 'created_at', width: 180 },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row) => h('div', { class: 'flex space-x-2' }, [
      h(NButton, { text: true, onClick: () => editUser(row) }, () => h(NIcon, () => h(Create))),
      row.id !== authStore.user?.id ? h(NPopconfirm, {
        onPositiveClick: () => deleteUser(row.id)
      }, {
        trigger: () => h(NButton, { text: true }, () => h(NIcon, () => h(Trash))),
        default: () => '确定删除？'
      }) : null
    ])
  }
]

async function fetchUsers() {
  loading.value = true
  try {
    const response = await api.get('/users')
    if (response.data.code === 0) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

function editUser(user: any) {
  message.info('编辑用户功能开发中')
}

async function deleteUser(id: number) {
  try {
    await api.delete(`/users/${id}`)
    message.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    message.error(error.message || '删除失败')
  }
}

onMounted(fetchUsers)
</script>
```

- [ ] **Step 7: 创建系统设置页面 src/views/admin/Settings.vue**

```vue
<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">系统设置</h2>
    
    <n-card title="导入书签">
      <n-upload
        accept=".html"
        :max="1"
        :custom-request="handleImport"
      >
        <n-button>选择文件</n-button>
      </n-upload>
      <p class="text-gray-500 text-sm mt-2">支持 Chrome、Firefox 等浏览器的书签 HTML 文件导入</p>
    </n-card>
    
    <n-card title="导出书签" class="mt-4">
      <n-space>
        <n-button @click="handleExport('html')">导出为 HTML</n-button>
        <n-button @click="handleExport('json')">导出为 JSON</n-button>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NUpload, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const message = useMessage()

async function handleImport({ file }: any) {
  const formData = new FormData()
  formData.append('file', file.file)
  
  try {
    const response = await api.post('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (response.data.code === 0) {
      message.success(`导入成功！共 ${response.data.data.total} 条，成功 ${response.data.data.success} 条`)
    }
  } catch (error: any) {
    message.error(error.message || '导入失败')
  }
}

function handleExport(format: string) {
  window.open(`/api/v1/export?format=${format}`, '_blank')
}
</script>
```

#### Task 17: 组件创建

**Files:**
- Create: `frontend/src/components/bookmark/Modal.vue`
- Create: `frontend/src/components/category/Modal.vue`
- Create: `frontend/src/components/tag/Modal.vue`

- [ ] **Step 1: 创建书签模态框 src/components/bookmark/Modal.vue**

```vue
<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑书签' : '添加书签'" style="width: 500px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="标题" path="title">
        <n-input v-model:value="form.title" placeholder="请输入书签标题" />
      </n-form-item>
      
      <n-form-item label="URL" path="url">
        <n-input v-model:value="form.url" placeholder="https://example.com" />
      </n-form-item>
      
      <n-form-item label="描述" path="description">
        <n-input v-model:value="form.description" type="textarea" placeholder="请输入描述（可选）" />
      </n-form-item>
      
      <n-form-item label="分类" path="category_id">
        <n-select
          v-model:value="form.category_id"
          :options="categoryOptions"
          placeholder="选择分类"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="标签" path="tag_ids">
        <n-select
          v-model:value="form.tag_ids"
          :options="tagOptions"
          multiple
          placeholder="选择标签"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="备用链接" path="alt_url">
        <n-input v-model:value="form.alt_url" placeholder="https://backup.example.com（可选）" />
      </n-form-item>
      
      <n-form-item label="私有">
        <n-switch v-model:value="form.is_private" />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NSwitch, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  bookmark?: any
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

const formRef = ref()
const loading = ref(false)
const categories = ref<any[]>([])
const tags = ref<any[]>([])

const form = ref({
  title: '',
  url: '',
  description: '',
  category_id: null as number | null,
  tag_ids: [] as number[],
  alt_url: '',
  is_private: false
})

const isEdit = computed(() => !!props.bookmark)

const categoryOptions = computed(() =>
  categories.value.map(c => ({ label: c.name, value: c.id }))
)

const tagOptions = computed(() =>
  tags.value.map(t => ({ label: t.name, value: t.id }))
)

const rules = {
  title: { required: true, message: '请输入标题', trigger: 'blur' },
  url: { required: true, message: '请输入URL', trigger: 'blur' }
}

watch(() => props.show, async (newVal) => {
  if (newVal) {
    await Promise.all([fetchCategories(), fetchTags()])
    if (props.bookmark) {
      form.value = {
        title: props.bookmark.title,
        url: props.bookmark.url,
        description: props.bookmark.description || '',
        category_id: props.bookmark.categoryId || null,
        tag_ids: props.bookmark.tags?.map((t: any) => t.id) || [],
        alt_url: props.bookmark.altUrl || '',
        is_private: !!props.bookmark.is_private
      }
    } else {
      form.value = {
        title: '',
        url: '',
        description: '',
        category_id: null,
        tag_ids: [],
        alt_url: '',
        is_private: false
      }
    }
  }
})

async function fetchCategories() {
  try {
    const response = await api.get('/categories')
    if (response.data.code === 0) {
      categories.value = flattenCategories(response.data.data)
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  }
}

function flattenCategories(cats: any[]): any[] {
  let result: any[] = []
  for (const cat of cats) {
    result.push(cat)
    if (cat.children && cat.children.length > 0) {
      result = result.concat(flattenCategories(cat.children))
    }
  }
  return result
}

async function fetchTags() {
  try {
    const response = await api.get('/tags')
    if (response.data.code === 0) {
      tags.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const data = {
      title: form.value.title,
      url: form.value.url,
      description: form.value.description || undefined,
      category_id: form.value.category_id || undefined,
      tag_ids: form.value.tag_ids.length > 0 ? form.value.tag_ids : undefined,
      alt_url: form.value.alt_url || undefined,
      is_private: form.value.is_private
    }
    
    if (isEdit.value) {
      await api.put(`/bookmarks/${props.bookmark.id}`, data)
      message.success('更新成功')
    } else {
      await api.post('/bookmarks', data)
      message.success('创建成功')
    }
    
    emit('update:show', false)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 2: 创建分类模态框 src/components/category/Modal.vue**

```vue
<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑分类' : '添加分类'" style="width: 400px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入分类名称" />
      </n-form-item>
      
      <n-form-item label="父分类" path="parent_id">
        <n-select
          v-model:value="form.parent_id"
          :options="parentOptions"
          placeholder="选择父分类（可选）"
          clearable
        />
      </n-form-item>
      
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="form.sort_order" :min="0" />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NInputNumber, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  category?: any
  categories: any[]
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

const formRef = ref()
const loading = ref(false)

const form = ref({
  name: '',
  parent_id: null as number | null,
  sort_order: 0
})

const isEdit = computed(() => !!props.category)

const parentOptions = computed(() => {
  const flatten = (cats: any[], result: any[] = []): any[] => {
    for (const cat of cats) {
      if (!props.category || cat.id !== props.category.id) {
        result.push({ label: cat.name, value: cat.id })
      }
      if (cat.children) {
        flatten(cat.children, result)
      }
    }
    return result
  }
  return flatten(props.categories)
})

const rules = {
  name: { required: true, message: '请输入分类名称', trigger: 'blur' }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.category) {
      form.value = {
        name: props.category.name,
        parent_id: props.category.parentId || null,
        sort_order: props.category.sortOrder || 0
      }
    } else {
      form.value = {
        name: '',
        parent_id: null,
        sort_order: 0
      }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    const data = {
      name: form.value.name,
      parent_id: form.value.parent_id || undefined,
      sort_order: form.value.sort_order
    }
    
    if (isEdit.value) {
      await api.put(`/categories/${props.category.id}`, data)
      message.success('更新成功')
    } else {
      await api.post('/categories', data)
      message.success('创建成功')
    }
    
    emit('update:show', false)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 3: 创建标签模态框 src/components/tag/Modal.vue**

```vue
<template>
  <n-modal v-model:show="show" preset="card" :title="isEdit ? '编辑标签' : '添加标签'" style="width: 400px">
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
      <n-form-item label="名称" path="name">
        <n-input v-model:value="form.name" placeholder="请输入标签名称" />
      </n-form-item>
      
      <n-form-item label="颜色" path="color">
        <n-color-picker v-model:value="form.color" :show-alpha="false" />
      </n-form-item>
    </n-form>
    
    <template #footer>
      <n-space justify="end">
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" :loading="loading" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NInput, NColorPicker, NButton, NSpace, useMessage } from 'naive-ui'
import api from '@/api'

const props = defineProps<{
  show: boolean
  tag?: any
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'success': []
}>()

const message = useMessage()

const formRef = ref()
const loading = ref(false)

const form = ref({
  name: '',
  color: '#3b82f6'
})

const isEdit = computed(() => !!props.tag)

const rules = {
  name: { required: true, message: '请输入标签名称', trigger: 'blur' }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.tag) {
      form.value = {
        name: props.tag.name,
        color: props.tag.color || '#3b82f6'
      }
    } else {
      form.value = {
        name: '',
        color: '#3b82f6'
      }
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true
    
    if (isEdit.value) {
      await api.put(`/tags/${props.tag.id}`, form.value)
      message.success('更新成功')
    } else {
      await api.post('/tags', form.value)
      message.success('创建成功')
    }
    
    emit('update:show', false)
    emit('success')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>
```

---

### Phase 3: 部署配置

#### Task 18: Docker 配置

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建后端 Dockerfile**

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY backend/package.json ./
RUN bun install

COPY backend .

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

- [ ] **Step 2: 创建前端 Dockerfile**

```dockerfile
FROM node:20-alpine as builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: 创建前端 nginx 配置 frontend/nginx.conf**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

- [ ] **Step 4: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:/app/data/bookmarks.db
      - JWT_SECRET=change-this-in-production
    networks:
      - bookmark-network

  frontend:
    build:
      context: .
      dockerfile: frontend/Dockerfile
    ports:
      - "8080:80"
    depends_on:
      - backend
    networks:
      - bookmark-network

networks:
  bookmark-network:
    driver: bridge
```

---

## 3. 自检清单

### 规范检查

- [x] 所有 API 响应格式统一 `{ code, message, data }`
- [x] 使用 TypeScript 确保类型安全
- [x] 前端使用 Naive UI 组件库
- [x] 使用 Tailwind CSS 进行样式开发
- [x] 数据库使用 SQLite3 便于部署
- [x] 遵循 RESTful API 设计规范

### 功能覆盖

- [x] 用户认证 (注册/登录/登出)
- [x] 书签 CRUD
- [x] 分类管理 (支持二级分类)
- [x] 标签管理
- [x] 用户管理 (管理员)
- [x] 导入导出功能

---

## 4. 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-05-10-bookmark-manager-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach would you prefer?
