const mongoose = require('mongoose');
const databaseConfig = require('./database');
const env = require('./env');

const connectDB = async () => {
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
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${databaseConfig.uri}: ${error.message}`);
    if (env.isProduction) {
      console.error('[MongoDB Fatal] Database connection required in production mode. Exiting...');
      process.exit(1);
    }
    console.warn('[MongoDB Warning] Running backend in development mode without active database connection.');
  }
};

module.exports = connectDB;
