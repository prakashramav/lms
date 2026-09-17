const env = require('./env');

const loggingConfig = {
  level: env.isProduction ? 'info' : 'debug',
  sanitizeFields: [
    'password',
    'confirmPassword',
    'newPassword',
    'oldPassword',
    'token',
    'refreshToken',
    'accessToken',
    'apiKey',
    'secret',
    'creditCard',
  ],
  maskString: '***REDACTED***',
};

module.exports = loggingConfig;
