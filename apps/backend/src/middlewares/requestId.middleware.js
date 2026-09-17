const crypto = require('crypto');

/**
 * Request ID Middleware
 * Ensures every incoming HTTP request has a unique identifier
 * for end-to-end tracing, debugging, and audit logging.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.header('x-request-id') || req.header('X-Request-ID');
  const requestId = (incomingId && typeof incomingId === 'string' && incomingId.trim()) 
    ? incomingId.trim() 
    : crypto.randomUUID();

  req.id = requestId;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

module.exports = requestIdMiddleware;
