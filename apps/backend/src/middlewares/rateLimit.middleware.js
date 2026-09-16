const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 100, // Limit each IP to 100 requests per window in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
    errorCode: 'TOO_MANY_REQUESTS',
  },
  skip: () => env.NODE_ENV === 'test',
});

module.exports = {
  authLimiter,
};
