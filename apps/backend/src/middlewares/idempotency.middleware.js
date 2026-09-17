/**
 * Idempotency Middleware
 * Phase 15 — Reliability & Idempotency (Section 32)
 *
 * Prevents duplicate processing for critical state-mutating operations
 * when an Idempotency-Key header is supplied.
 */

const memoryCache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 60 * 60 * 1000).unref();

const idempotencyMiddleware = (req, res, next) => {
  // Idempotency is only applied to mutating methods
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (!idempotencyKey) {
    return next();
  }

  // Scope key by tenant / user if available to prevent cross-user collisions
  const userId = req.user ? req.user._id.toString() : 'anon';
  const compositeKey = `${userId}:${req.method}:${req.baseUrl || ''}${req.path}:${idempotencyKey}`;

  const cached = memoryCache.get(compositeKey);
  if (cached) {
    if (cached.inFlight) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'IDEMPOTENT_OPERATION_IN_PROGRESS',
          message: 'A request with this idempotency key is currently being processed.',
          details: { idempotencyKey },
        },
        errorCode: 'CONFLICT',
      });
    }

    // Return stored response
    res.set('X-Cache-Idempotent', 'HIT');
    return res.status(cached.statusCode).json(cached.body);
  }

  // Mark as in-flight
  memoryCache.set(compositeKey, {
    inFlight: true,
    expiresAt: Date.now() + TTL_MS,
  });

  // Intercept response to store result
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only cache successful or client-error responses, avoid caching transient 5xx server errors
    if (res.statusCode < 500) {
      memoryCache.set(compositeKey, {
        inFlight: false,
        statusCode: res.statusCode,
        body,
        expiresAt: Date.now() + TTL_MS,
      });
    } else {
      memoryCache.delete(compositeKey);
    }
    return originalJson(body);
  };

  next();
};

module.exports = idempotencyMiddleware;
