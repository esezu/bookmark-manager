import { Context, Next } from 'hono';

export const requestLogger = async (c: Context, next: Next) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  
  await next();
  
  const duration = Date.now() - start;
  const status = c.res.status;
  
  const log = {
    timestamp: new Date().toISOString(),
    method,
    path,
    status,
    duration: `${duration}ms`,
    ip,
    userAgent: c.req.header('user-agent')
  };
  
  if (status >= 400) {
    console.error(`[ERROR] ${JSON.stringify(log)}`);
  } else if (status >= 300) {
    console.warn(`[WARN] ${JSON.stringify(log)}`);
  } else {
    console.log(`[INFO] ${JSON.stringify(log)}`);
  }
};

export const suspiciousRequestDetector = async (c: Context, next: Next) => {
  const path = c.req.path.toLowerCase();
  const suspiciousPatterns = [
    /\.\./,
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /union.*select/i,
    /exec\s*\(/i,
    /eval\s*\(/i
  ];
  
  const queryParams = c.req.query();
  const body = await c.req.text().catch(() => '');
  
  const combinedInput = JSON.stringify({ path, query: queryParams, body });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combinedInput)) {
      console.warn(`[SECURITY] Suspicious request detected from ${c.req.header('x-forwarded-for') || 'unknown'}:`, {
        path,
        pattern: pattern.toString()
      });
      return c.json({
        code: 400,
        message: '无效的请求'
      }, 400);
    }
  }
  
  await next();
};