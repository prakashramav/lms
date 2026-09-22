const env = require('../config/env');
const { logSecurityEvent, SECURITY_EVENTS } = require('../services/securityLogger');

/**
 * CSRF Protection Middleware via Strict Origin & Referer Verification
 * Protects state-changing operations (POST, PUT, PATCH, DELETE) when using cookie authentication.
 */
const csrfProtection = (req, res, next) => {
  // Safe idempotent read-only methods are exempt from CSRF checks
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public webhook endpoints or server-to-server health checks if any
  if (req.path.startsWith('/health') || req.path.startsWith('/live') || req.path.startsWith('/ready')) {
    return next();
  }

  // Extract Origin or Referer header
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Compile list of permitted origins
  const allowedOrigins = [
    ...env.CORS_ORIGIN,
    env.STUDENT_APP_URL,
    env.INSTRUCTOR_APP_URL,
    env.ADMIN_APP_URL,
  ].filter(Boolean).map((url) => url.replace(/\/$/, '').toLowerCase());

  let requestOrigin = null;

  if (origin) {
    requestOrigin = origin.replace(/\/$/, '').toLowerCase();
  } else if (referer) {
    try {
      const parsedUrl = new URL(referer);
      requestOrigin = `${parsedUrl.protocol}//${parsedUrl.host}`.toLowerCase();
    } catch {
      requestOrigin = null;
    }
  }

  // If request has an origin, verify that it matches allowed frontend domains
  if (requestOrigin) {
    const isAllowed =
      allowedOrigins.includes(requestOrigin) ||
      (!env.isProduction && (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')));

    if (!isAllowed) {
      logSecurityEvent({
        event: SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        role: req.user?.role || 'ANONYMOUS',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId: req.id || req.requestId,
        details: { reason: 'CSRF Origin Mismatch', rejectedOrigin: requestOrigin, path: req.originalUrl, method: req.method },
        success: false,
      });

      return res.status(403).json({
        success: false,
        message: 'Forbidden: Request blocked by Cross-Site Request Forgery (CSRF) protection.',
        errorCode: 'CSRF_BLOCKED',
        requestId: req.id || req.requestId,
      });
    }
  } else {
    // If no origin or referer is sent:
    // In production, require custom header (X-Requested-With or X-Client-Version or Authorization) for mutating requests
    if (env.isProduction && !req.headers['x-requested-with'] && !req.headers['x-client-version'] && !req.headers.authorization) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Missing origin verification headers on state-changing operation.',
        errorCode: 'CSRF_HEADER_MISSING',
        requestId: req.id || req.requestId,
      });
    }
  }

  next();
};

module.exports = csrfProtection;
