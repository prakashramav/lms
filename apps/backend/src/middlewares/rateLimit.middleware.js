const rateLimit = require('express-rate-limit');
const rateLimitConfig = require('../config/rateLimit');
const env = require('../config/env');

const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message,
    skip: () => env.isTest, // Skip in test mode unless overridden
  });
};

const generalLimiter = createLimiter(rateLimitConfig.general);
const authLimiter = createLimiter(rateLimitConfig.auth);
const aiLimiter = createLimiter(rateLimitConfig.ai);
const codingLimiter = createLimiter(rateLimitConfig.coding);
const adminLimiter = createLimiter(rateLimitConfig.admin);
const uploadLimiter = createLimiter(rateLimitConfig.upload);

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  codingLimiter,
  adminLimiter,
  uploadLimiter,
  createLimiter,
};
