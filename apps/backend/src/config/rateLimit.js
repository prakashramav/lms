const env = require('./env');

const rateLimitConfig = {
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isTest ? 10000 : 500,
    message: {
      success: false,
      message: 'Too many requests from this IP. Please slow down.',
      errorCode: 'TOO_MANY_REQUESTS',
    },
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isTest ? 10000 : 25, // Stricter for login/register/password-reset
    message: {
      success: false,
      message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
      errorCode: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
  ai: {
    windowMs: 60 * 1000, // 1 minute
    max: env.isTest ? 10000 : 30, // 30 requests per minute per IP/user
    message: {
      success: false,
      message: 'AI rate limit exceeded. Please wait a moment before sending another prompt.',
      errorCode: 'AI_RATE_LIMIT_EXCEEDED',
    },
  },
  coding: {
    windowMs: 60 * 1000, // 1 minute
    max: env.isTest ? 10000 : 20, // 20 code executions per minute
    message: {
      success: false,
      message: 'Code execution limit reached. Please wait before submitting additional runs.',
      errorCode: 'CODING_RATE_LIMIT_EXCEEDED',
    },
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.isTest ? 10000 : 300,
    message: {
      success: false,
      message: 'Admin request rate limit exceeded.',
      errorCode: 'ADMIN_RATE_LIMIT_EXCEEDED',
    },
  },
  upload: {
    windowMs: 15 * 60 * 1000,
    max: env.isTest ? 10000 : 50,
    message: {
      success: false,
      message: 'File upload rate limit reached.',
      errorCode: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    },
  },
};

module.exports = rateLimitConfig;
