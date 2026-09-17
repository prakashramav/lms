const jwt = require('jsonwebtoken');
const { User } = require('../models/user.model');
const env = require('../config/env');

/**
 * Authentication middleware
 * Validates JWT access token, fetches user, and verifies account status
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const requestId = req.id || req.requestId || 'unknown';

    // Extract Bearer token from headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
        errorCode: 'UNAUTHORIZED',
        requestId,
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Access token expired. Please refresh your session.',
          errorCode: 'TOKEN_EXPIRED',
          requestId,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid access token.',
        errorCode: 'INVALID_TOKEN',
        requestId,
      });
    }

    // Find user in database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session no longer valid.',
        errorCode: 'USER_NOT_FOUND',
        requestId,
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
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
 * Restricts access to specified roles
 */
const authorize = (...roles) => {
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

    if (!roles.includes(req.user.role)) {
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
 * If a token is provided, populates req.user; otherwise passes through without failing
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.status === 'ACTIVE') {
        req.user = user;
      }
    } catch {
      // Ignore token verification errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuthenticate,
};
