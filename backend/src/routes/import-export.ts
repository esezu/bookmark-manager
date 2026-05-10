import { Hono } from 'hono';
import { success, error } from '../utils/response.js';
import { authMiddleware } from '../middleware/auth.js';
import { db } from '../db/index.js';
import { bookmarks, categories } from '../db/schema.js';
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
