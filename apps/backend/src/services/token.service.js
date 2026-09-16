const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/refreshToken.model');
const env = require('../config/env');

const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

/**
 * Hash raw token with SHA-256
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate JWT Access Token
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });
};

/**
 * Create and persist Refresh Token
 */
const createRefreshToken = async (userId, req = null) => {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  const userAgent = req ? req.headers['user-agent'] : null;
  const ipAddress = req ? req.ip || req.connection.remoteAddress : null;

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
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
  const newRefreshToken = await createRefreshToken(existingToken.userId, req);

  return {
    userId: existingToken.userId,
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
 * Attach HTTP-only cookie to response
 */
const setRefreshTokenCookie = (res, rawToken, expiresAt) => {
  const isProduction = env.NODE_ENV === 'production';
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    expires: expiresAt,
    path: '/api/v1/auth',
  });
};

/**
 * Clear refresh token cookie
 */
const clearRefreshTokenCookie = (res) => {
  const isProduction = env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/v1/auth',
  });
};

module.exports = {
  hashToken,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
};
