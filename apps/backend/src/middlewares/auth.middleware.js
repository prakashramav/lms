const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');
const tokenService = require('../services/token.service');
const { logSecurityEvent, SECURITY_EVENTS } = require('../services/securityLogger');
const env = require('../config/env');

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

const getTargetPortal = (req) => {
  const origin = req.headers.origin || req.headers.referer || '';
  const portal = (req.headers['x-portal'] || '').toLowerCase();

  if (portal === 'student' || origin.includes(':3000') || (req.originalUrl && req.originalUrl.startsWith('/api/v1/student'))) {
    return 'student';
  }
  if (portal === 'instructor' || origin.includes(':3001') || (req.originalUrl && req.originalUrl.startsWith('/api/v1/instructor'))) {
    return 'instructor';
  }
  if (portal === 'admin' || origin.includes(':3002') || (req.originalUrl && req.originalUrl.startsWith('/api/v1/admin'))) {
    return 'admin';
  }
  return null;
};

const extractTokenFromRequest = (req) => {
  const portal = getTargetPortal(req);

  let roleCookie = null;
  if (portal === 'student') {
    roleCookie = 'auth_token_student';
  } else if (portal === 'instructor') {
    roleCookie = 'auth_token_instructor';
  } else if (portal === 'admin') {
    roleCookie = 'auth_token_admin';
  }

  if (roleCookie && req.cookies && req.cookies[roleCookie]) {
    return req.cookies[roleCookie];
  }
  if (req.cookies && req.cookies[tokenService.AUTH_COOKIE_NAME]) {
    return req.cookies[tokenService.AUTH_COOKIE_NAME];
  }
  if (req.cookies && req.cookies.accessToken) {
    return req.cookies.accessToken;
  }
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const raw = req.headers.authorization.split(' ')[1];
    if (raw && raw !== 'cookie-session' && raw !== 'null' && raw !== 'undefined') {
      return raw;
    }
  }
  return null;
};

/**
 * Authentication middleware
 * Validates 7-day HTTP-only cookie or Bearer JWT token, enforces expiration,
 * verifies user existence and ACTIVE status, and clears cookies on failure.
 */
const authenticate = async (req, res, next) => {
  const requestId = req.id || req.requestId || 'unknown';
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No session cookie or token provided.',
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    // 3. Verify JWT token cryptographically
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      // Clear cookie when invalid or expired for targeted portal
      const targetPortal = getTargetPortal(req);
      tokenService.clearAuthCookie(res, targetPortal);

      if (err.name === 'TokenExpiredError') {
        logSecurityEvent({
          event: SECURITY_EVENTS.SESSION_EXPIRED,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          requestId,
          details: { error: 'TokenExpiredError' },
          success: false,
        });

        return res.status(401).json({
          success: false,
          message: 'Authentication session expired. Please sign in again.',
          errorCode: 'TOKEN_EXPIRED',
          requestId,
        });
      }

      logSecurityEvent({
        event: SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
        details: { error: err.message },
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication session.',
        errorCode: 'INVALID_TOKEN',
        requestId,
      });
    }

    // 4. Server-Side 7-Day Expiration Enforcement
    const currentEpoch = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentEpoch) {
      tokenService.clearAuthCookie(res);
      logSecurityEvent({
        event: SECURITY_EVENTS.SESSION_EXPIRED,
        userId: decoded.userId,
        role: decoded.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
        details: { exp: decoded.exp, now: currentEpoch },
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: 'Authentication session expired. Maximum 7-day lifetime reached.',
        errorCode: 'TOKEN_EXPIRED',
        requestId,
      });
    }

    // 5. Find user in database
    const targetPortal = getTargetPortal(req);
    const user = await User.findById(decoded.userId);
    if (!user) {
      tokenService.clearAuthCookie(res, targetPortal);
      logSecurityEvent({
        event: SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        userId: decoded.userId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
        details: { reason: 'User record not found' },
        success: false,
      });

      return res.status(401).json({
        success: false,
        message: 'User session no longer valid.',
        errorCode: 'USER_NOT_FOUND',
        requestId,
      });
    }

    // 6. Check account status (ACTIVE vs SUSPENDED / INACTIVE / DELETED)
    if (user.status !== 'ACTIVE') {
      tokenService.clearAuthCookie(res, user.role || targetPortal);
      logSecurityEvent({
        event: SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        userId: user._id,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
        details: { status: user.status },
        success: false,
      });

      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Access denied.`,
        errorCode: 'ACCOUNT_INACTIVE',
        requestId,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based Authorization middleware
 * Restricts access to specified roles (case-insensitive, e.g. 'student', 'STUDENT', 'admin')
 */
const authorize = (...roles) => {
  const normalizedRoles = roles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    const requestId = req.id || req.requestId || 'unknown';
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isAllowed = normalizedRoles.includes(userRole) || (isSuperAdmin && normalizedRoles.includes('ADMIN'));

    if (!isAllowed) {
      logSecurityEvent({
        event: SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
        userId: req.user._id,
        role: req.user.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requestId,
        details: { requiredRoles: normalizedRoles, actualRole: userRole, path: req.originalUrl },
        success: false,
      });

      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of roles: [${roles.join(', ')}]`,
        errorCode: 'FORBIDDEN',
        requestId,
      });
    }

    next();
  };
};

/**
 * Optional Authentication middleware
 * If a valid token/cookie is provided, populates req.user; otherwise passes through
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = extractTokenFromRequest(req);

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const currentEpoch = Math.floor(Date.now() / 1000);
      if (!decoded.exp || decoded.exp >= currentEpoch) {
        const user = await User.findById(decoded.userId);
        if (user && user.status === 'ACTIVE') {
          req.user = user;
        }
      }
    } catch {
      // Ignore errors in optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  requireAuth: authenticate,
  requireRole: authorize,
  optionalAuthenticate,
};
