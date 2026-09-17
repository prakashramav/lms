const env = require('./env');

const authConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  cookie: {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? 'strict' : 'lax',
    domain: env.COOKIE_DOMAIN,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  },
  saltRounds: 10,
  passwordResetExpiryHours: 1,
};

module.exports = authConfig;
