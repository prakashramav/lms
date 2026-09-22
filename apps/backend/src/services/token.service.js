const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken.model');
const env = require('../config/env');

const AUTH_COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';
const SESSION_MAX_AGE_DAYS = parseInt(process.env.SESSION_MAX_AGE_DAYS || '7', 10);
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || env.JWT_EXPIRES_IN || `${SESSION_MAX_AGE_DAYS}d`;

/**
 * Hash raw token with SHA-256
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate 7-day JWT Authentication Token for HTTP-only cookie
 */
const generateAuthToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${SESSION_MAX_AGE_DAYS}d`,
  });
};

/**
 * Generate JWT Access Token (alias / backward-compatible helper)
 */
const generateAccessToken = (user) => {
  return generateAuthToken(user);
};

/**
 * Create and persist Refresh / Session Token
 */
const createRefreshToken = async (userId, req = null, role = 'STUDENT') => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_MAX_AGE_DAYS);

  const userAgent = req ? req.headers['user-agent'] : null;
  const ipAddress = req ? req.ip || req.connection?.remoteAddress : null;

  await RefreshToken.create({
    userId,
    tokenHash,
    role,
    expiresAt,
    lastUsedAt: new Date(),
    userAgent,
    ipAddress,
  });

  return { rawToken, expiresAt };
};

/**
 * Rotate Refresh Token: Revoke current and issue replacement
 */
const rotateRefreshToken = async (rawToken, req = null) => {
  const tokenHash = hashToken(rawToken);
  const existingToken = await RefreshToken.findOne({ tokenHash });

  if (!existingToken) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  if (existingToken.revokedAt || new Date() > existingToken.expiresAt) {
    throw new Error('EXPIRED_OR_REVOKED_REFRESH_TOKEN');
  }

  // Revoke current token
  existingToken.revokedAt = new Date();
  await existingToken.save();

  // Issue new refresh token
  const newRefreshToken = await createRefreshToken(existingToken.userId, req, existingToken.role);

  return {
    userId: existingToken.userId,
    role: existingToken.role,
    newRefreshToken,
  };
};

/**
 * Revoke single refresh token
 */
const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );
};

/**
 * Revoke all active sessions for a user
 */
const revokeAllUserTokens = async (userId) => {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
};

/**
 * Helper to determine cookie security options
 */
const getCookieOptions = (maxAgeMs = SESSION_MAX_AGE_MS) => {
  // Use SameSite=None and Secure=true to allow cross-port/cross-origin session transmission
  // Chrome and modern browsers treat localhost as a secure context for Secure cookies.
  const sameSite = process.env.COOKIE_SAME_SITE || 'none';
  const secure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : true;
  const domain = process.env.COOKIE_DOMAIN || env.COOKIE_DOMAIN || undefined;

  const options = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };

  if (maxAgeMs !== undefined && maxAgeMs !== null) {
    options.maxAge = maxAgeMs;
  }

  if (domain) {
    options.domain = domain;
  }

  return options;
};

const getCookieNameForRole = (role) => {
  if (!role) return AUTH_COOKIE_NAME;
  const normalized = role.toUpperCase();
  if (normalized === 'STUDENT') return 'auth_token_student';
  if (normalized === 'INSTRUCTOR') return 'auth_token_instructor';
  if (normalized === 'ADMIN' || normalized === 'SUPER_ADMIN') return 'auth_token_admin';
  return AUTH_COOKIE_NAME;
};

/**
 * Set HTTP-only 7-day authentication cookie on response
 */
const setAuthCookie = (res, token, maxAgeMs = SESSION_MAX_AGE_MS, role = null) => {
  const options = getCookieOptions(maxAgeMs);
  res.cookie(AUTH_COOKIE_NAME, token, options);
  res.cookie('accessToken', token, options);

  // Set role-scoped cookie for localhost multi-portal isolation
  if (role) {
    const roleCookieName = getCookieNameForRole(role);
    res.cookie(roleCookieName, token, options);
  }
};

/**
 * Clear authentication cookies on response
 */
const clearAuthCookie = (res, role = null) => {
  const options = getCookieOptions(undefined);
  delete options.maxAge;
  if (!role) {
    res.clearCookie(AUTH_COOKIE_NAME, options);
    res.clearCookie('accessToken', options);
    res.clearCookie('auth_token_student', options);
    res.clearCookie('auth_token_instructor', options);
    res.clearCookie('auth_token_admin', options);
  } else {
    const roleCookie = getCookieNameForRole(role);
    res.clearCookie(roleCookie, options);
    res.clearCookie(AUTH_COOKIE_NAME, options);
    res.clearCookie('accessToken', options);
  }
};

/**
 * Attach HTTP-only refresh token cookie to response
 */
const setRefreshTokenCookie = (res, rawToken, expiresAt, role = null) => {
  const options = getCookieOptions(undefined);
  options.expires = expiresAt;

  res.cookie('refreshToken', rawToken, options);
  if (role) {
    const refreshRoleCookie = `refreshToken_${role.toLowerCase()}`;
    res.cookie(refreshRoleCookie, rawToken, options);
  }
};

/**
 * Clear refresh token cookie
 */
const clearRefreshTokenCookie = (res, role = null) => {
  const options = getCookieOptions(undefined);
  delete options.maxAge;
  if (!role) {
    res.clearCookie('refreshToken', options);
    res.clearCookie('refreshToken_student', options);
    res.clearCookie('refreshToken_instructor', options);
    res.clearCookie('refreshToken_admin', options);
  } else {
    const normalizedRole = role.toLowerCase();
    res.clearCookie(`refreshToken_${normalizedRole}`, options);
    res.clearCookie('refreshToken', options);
  }
};

module.exports = {
  AUTH_COOKIE_NAME,
  SESSION_MAX_AGE_DAYS,
  SESSION_MAX_AGE_MS,
  hashToken,
  generateAuthToken,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setAuthCookie,
  clearAuthCookie,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getCookieOptions,
};
