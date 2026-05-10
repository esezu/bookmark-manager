export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  rateLimit: {
    strict: {
      windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '5')
    },
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10')
    },
    general: {
      windowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '60')
    }
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:5173', 'http://localhost:8080']
  }
};

export function validateConfig() {
  const errors: string[] = [];
  
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
      errors.push('JWT_SECRET must be set in production environment');
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const origins = process.env.ALLOWED_ORIGINS.split(',');
      if (origins.includes('http://localhost:5173') || origins.includes('http://localhost:8080')) {
        console.warn('[WARN] localhost origins should not be used in production');
      }
    }
  }
  
  return errors;
}

const configErrors = validateConfig();
if (configErrors.length > 0) {
  console.error('[CONFIG ERROR]', configErrors);
}