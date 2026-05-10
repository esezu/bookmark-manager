import { Context, Next } from 'hono';

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:8080'];

export const cors = async (c: Context, next: Next) => {
  const origin = c.req.header('Origin');
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'production') {
    c.header('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0] || '');
  } else {
    c.header('Access-Control-Allow-Origin', '*');
  }
  
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  c.header('Access-Control-Max-Age', '86400');
  c.header('Access-Control-Allow-Credentials', 'true');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
};