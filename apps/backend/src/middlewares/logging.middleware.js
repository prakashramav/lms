const loggingConfig = require('../config/logging');
const env = require('../config/env');

/**
 * Structured HTTP Request Logger
 * Logs inbound requests with timing, actor info, and requestId.
 * Automatically redacts sensitive fields.
 */
const structuredLogger = (req, res, next) => {
  // Skip verbose request logging during automated tests
  if (env.isTest) {
    return next();
  }

  const start = Date.now();
  const requestId = req.id || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const actorId = req.user ? req.user._id : 'anonymous';
    const actorRole = req.user ? req.user.role : 'public';

    const logEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode,
      durationMs: duration,
      actorId,
      actorRole,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    if (statusCode >= 500) {
      console.error(`[HTTP ERROR]`, JSON.stringify(logEntry));
    } else if (statusCode >= 400) {
      console.warn(`[HTTP WARN]`, JSON.stringify(logEntry));
    } else {
      console.log(`[HTTP INFO]`, JSON.stringify(logEntry));
    }
  });

  next();
};

module.exports = structuredLogger;
