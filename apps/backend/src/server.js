const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[Backend Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Backend Server] Health endpoint: http://localhost:${env.PORT}/api/v1/health`);
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n[Backend Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Backend Server] Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
