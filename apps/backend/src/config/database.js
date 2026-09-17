const env = require('./env');

const databaseConfig = {
  uri: env.MONGODB_URI,
  options: {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    autoIndex: env.NODE_ENV !== 'production', // Don't auto-build indexes in high-throughput production
  },
};

module.exports = databaseConfig;
