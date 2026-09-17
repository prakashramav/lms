const crypto = require('crypto');
const { User } = require('../models/user.model');
const tokenService = require('../services/token.service');
const env = require('../config/env');

/**
 * Register a new Student
 * @route POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Role MUST default to STUDENT; public cannot self-assign INSTRUCTOR or ADMIN
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: false,
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const { rawToken: refreshToken, expiresAt } = await tokenService.createRefreshToken(user._id, req);

    tokenService.setRefreshTokenCookie(res, refreshToken, expiresAt);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user (Student, Instructor, or Admin)
 * @route POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, expectedRole } = req.body;

    // Retrieve user including password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
      });
    }

    // Check account status
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Please contact support.`,
        errorCode: 'ACCOUNT_INACTIVE',
      });
    }

    // Cross-application protection: verify expected role if specified by frontend portal
    if (expectedRole) {
      const isAuthorized =
        expectedRole === 'ADMIN'
          ? ['ADMIN', 'SUPER_ADMIN'].includes(user.role)
          : user.role === expectedRole;

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Your account (${user.role}) is not authorized to sign into the ${expectedRole} portal.`,
          errorCode: 'ROLE_MISMATCH',
        });
      }
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const accessToken = tokenService.generateAccessToken(user);
    const { rawToken: refreshToken, expiresAt } = await tokenService.createRefreshToken(user._id, req);

    tokenService.setRefreshTokenCookie(res, refreshToken, expiresAt);

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rotate Refresh Token
 * @route POST /api/v1/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const rawToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided.',
        errorCode: 'REFRESH_TOKEN_REQUIRED',
      });
    }

    let rotationResult;
    try {
      rotationResult = await tokenService.rotateRefreshToken(rawToken, req);
    } catch (err) {
      tokenService.clearRefreshTokenCookie(res);
      return res.status(401).json({
        success: false,
        message: 'Refresh token is expired or invalid.',
        errorCode: 'INVALID_REFRESH_TOKEN',
      });
    }

    const user = await User.findById(rotationResult.userId);
    if (!user || user.status !== 'ACTIVE') {
      tokenService.clearRefreshTokenCookie(res);
      return res.status(403).json({
        success: false,
        message: 'Account is no longer active.',
        errorCode: 'ACCOUNT_INACTIVE',
      });
    }

    const newAccessToken = tokenService.generateAccessToken(user);
    tokenService.setRefreshTokenCookie(
      res,
      rotationResult.newRefreshToken.rawToken,
      rotationResult.newRefreshToken.expiresAt
    );

    res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
      data: {
        accessToken: newAccessToken,
        refreshToken: rotationResult.newRefreshToken.rawToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * @route POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const rawToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;
    if (rawToken) {
      await tokenService.revokeRefreshToken(rawToken);
    }

    tokenService.clearRefreshTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user
 * @route GET /api/v1/auth/me
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  });
};

/**
 * Forgot Password
 * @route POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    let devResetToken = null;

    if (user && user.status === 'ACTIVE') {
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      devResetToken = rawResetToken;
      console.log(`[Password Reset Dev] Link: /reset-password?token=${rawResetToken}`);
    }

    // Always return the exact same message to prevent account enumeration
    res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
      ...((env.NODE_ENV === 'development' || env.NODE_ENV === 'test') && devResetToken && { devResetToken }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password
 * @route POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
        errorCode: 'INVALID_RESET_TOKEN',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Revoke all existing sessions for security
    await tokenService.revokeAllUserTokens(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You may now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email
 * @route POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or expired.',
        errorCode: 'INVALID_VERIFY_TOKEN',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
};
