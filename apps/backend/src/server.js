const mongoose = require('mongoose');
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');
const { seedIntelligenceBasics } = require('./services/intelligence/intelligenceSeed');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Phase 11: Seed foundational skills, badges, and intelligence flags
  await seedIntelligenceBasics();

  const server = app.listen(env.PORT, () => {
    console.log(`[Backend Server] v${env.APP_VERSION} running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Backend Server] Health probe: http://localhost:${env.PORT}/health`);
    console.log(`[Backend Server] Readiness probe: http://localhost:${env.PORT}/ready`);
    console.log(`[Backend Server] API v1 root: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful shutdown handling
  let isShuttingDown = false;
  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Backend Server] Received ${signal}. Starting graceful shutdown...`);

    // Force close after 10s timeout to prevent hanging connections
    const forceExitTimer = setTimeout(() => {
      console.error('[Backend Server] Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    server.close(async (err) => {
      if (err) {
        console.error('[Backend Server] Error closing HTTP server:', err);
      } else {
        console.log('[Backend Server] HTTP listener stopped.');
      }

      try {
        if (mongoose.connection && mongoose.connection.readyState !== 0) {
          await mongoose.connection.close(false);
          console.log('[Backend Server] MongoDB connection closed.');
        }
      } catch (dbErr) {
        console.error('[Backend Server] Error closing MongoDB connection:', dbErr);
      }

      console.log('[Backend Server] Graceful shutdown completed cleanly.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections and exceptions
  process.on('unhandledRejection', (reason) => {
    console.error('[Backend Server] Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[Backend Server] Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
};

startServer();
