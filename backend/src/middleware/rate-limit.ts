import { Context, Next } from 'hono';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const key = `rate_limit:${ip}`;
    const now = Date.now();
    
    let entry = rateLimitStore.get(key);
    
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + options.windowMs
      };
      rateLimitStore.set(key, entry);
    } else {
      entry.count++;
    }
    
    const remaining = Math.max(0, options.maxRequests - entry.count);
    const resetTime = Math.ceil((entry.resetTime - now) / 1000);
    
    c.header('X-RateLimit-Limit', String(options.maxRequests));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetTime));
    
    if (entry.count > options.maxRequests) {
      c.header('Retry-After', String(resetTime));
      return c.json({
        code: 429,
        message: options.message || `请求过于频繁，请 ${resetTime} 秒后重试`
      }, 429);
    }
    
    await next();
  };
}

export const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: '登录尝试过于频繁，请 1 分钟后再试'
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: '认证请求过于频繁，请稍后再试'
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: '请求过于频繁，请稍后再试'
});