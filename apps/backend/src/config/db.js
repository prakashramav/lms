const mongoose = require('mongoose');
const databaseConfig = require('./database');
const env = require('./env');

const slowQueryPlugin = require('../plugins/slowQueryPlugin');

// Register global slow query detection plugin for all Mongoose models
mongoose.plugin(slowQueryPlugin);

const connectDB = async (retryCount = 0, maxRetries = 3) => {
  try {
    const conn = await mongoose.connect(databaseConfig.uri, databaseConfig.options);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB Connection Error]: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB Warning]: Database connection disconnected.');
    });

    return conn;
  } catch (error) {
    console.warn(`[MongoDB Warning] Connection attempt ${retryCount + 1}/${maxRetries} failed for ${databaseConfig.uri}: ${error.message}`);
    if (retryCount < maxRetries - 1 && env.isProduction) {
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 5000);
      console.log(`[MongoDB Retry] Retrying in ${backoffMs}ms...`);
      await new Promise((res) => setTimeout(res, backoffMs));
      return connectDB(retryCount + 1, maxRetries);
    }

    if (env.isProduction) {
      console.error('[MongoDB Fatal] Database connection required in production mode. Exiting...');
      process.exit(1);
    }
    console.warn('[MongoDB Warning] Running backend in development mode without active database connection.');
  }
};

module.exports = connectDB;
