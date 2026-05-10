import { Hono } from 'hono';
import { cors } from './middleware/cors.js';
import { authRoutes } from './routes/auth.js';
import { bookmarkRoutes } from './routes/bookmark.js';
import { categoryRoutes } from './routes/category.js';
import { tagRoutes } from './routes/tag.js';
import { userRoutes } from './routes/user.js';
import { importExportRoutes } from './routes/import-export.js';

export const app = new Hono();

app.use('*', cors);

app.get('/', (c) => c.json({ message: 'Bookmark Manager API' }));

app.route('/api/v1/auth', authRoutes);
app.route('/api/v1/bookmarks', bookmarkRoutes);
app.route('/api/v1/categories', categoryRoutes);
app.route('/api/v1/tags', tagRoutes);
app.route('/api/v1/users', userRoutes);
app.route('/api/v1', importExportRoutes);
