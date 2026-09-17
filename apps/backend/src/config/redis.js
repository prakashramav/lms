const env = require('./env');

const redisConfig = {
  url: env.REDIS_URL,
  keyPrefix: 'edtech:',
  ttl: {
    courseCatalog: 300, // 5 minutes
    categories: 3600,   // 1 hour
    featureFlags: 60,   // 1 minute
    systemHealth: 30,   // 30 seconds
  },
  retryStrategy: (times) => {
    // Reconnect with exponential backoff up to 2 seconds
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
};

module.exports = redisConfig;
