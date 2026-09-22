const AuditLog = require('../models/auditLog.model');
const env = require('../config/env');

const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
};

/**
 * Sanitize metadata to guarantee no secrets/passwords/tokens are logged
 */
const sanitizeSecurityMetadata = (obj = {}) => {
  if (!obj || typeof obj !== 'object') return {};
  const sanitized = {};
  const forbiddenKeys = [
    'password',
    'token',
    'jwt',
    'accessToken',
    'refreshToken',
    'auth_token',
    'secret',
    'cookie',
    'authorization',
  ];

  for (const [k, v] of Object.entries(obj)) {
    const lowerKey = k.toLowerCase();
    if (forbiddenKeys.some((f) => lowerKey.includes(f))) {
      continue; // Exclude secrets
    }
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      sanitized[k] = sanitizeSecurityMetadata(v);
    } else {
      sanitized[k] = v;
    }
  }

  return sanitized;
};

/**
 * Record a security event
 */
const logSecurityEvent = async ({
  event,
  userId = null,
  role = 'SYSTEM',
  ipAddress = null,
  userAgent = null,
  requestId = null,
  details = {},
  success = true,
}) => {
  try {
    const cleanDetails = sanitizeSecurityMetadata(details);

    if (!env.isTest) {
      console.log(`[SECURITY] [${event}] user=${userId || 'anonymous'} role=${role} ip=${ipAddress || 'unknown'} req=${requestId || '-'}`);
    }

    // Persist to AuditLog if actorId is a valid ObjectId (or fallback to system logging)
    if (userId) {
      await AuditLog.create({
        actorId: userId,
        actorRole: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYER'].includes(role) ? role : 'SYSTEM',
        action: event,
        resourceType: 'USER',
        resourceId: userId,
        result: success ? 'SUCCESS' : 'FAILURE',
        ipAddress,
        userAgent,
        requestId,
        metadata: cleanDetails,
        timestamp: new Date(),
      }).catch((err) => {
        // Non-blocking log persistence failure
        if (!env.isTest) {
          console.error('[SecurityLogger] Failed to persist audit record:', err.message);
        }
      });
    }
  } catch (err) {
    if (!env.isTest) {
      console.error('[SecurityLogger] Logging error:', err.message);
    }
  }
};

module.exports = {
  SECURITY_EVENTS,
  logSecurityEvent,
  sanitizeSecurityMetadata,
};
