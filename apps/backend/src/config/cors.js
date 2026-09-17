const env = require('./env');

const corsConfig = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, server-to-server, or local tests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      ...env.CORS_ORIGIN,
      env.STUDENT_APP_URL,
      env.INSTRUCTOR_APP_URL,
      env.ADMIN_APP_URL,
    ].map((u) => u.replace(/\/$/, ''));

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (allowedOrigins.includes(normalizedOrigin) || (!env.isProduction && (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')))) {
      return callback(null, true);
    }

    return callback(new Error(`Blocked by CORS policy: Origin ${origin} is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Client-Version'],
  exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  maxAge: 86400, // 24 hours preflight cache
};

module.exports = corsConfig;
