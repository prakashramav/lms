const mongoose = require('mongoose');
const env = require('../config/env');

/**
 * Health check controller
 * @route GET /api/v1/health
 */
const getHealth = (req, res) => {
  if (req.originalUrl === '/health' || req.path === '/health') {
    return res.status(200).json({
      status: 'UP',
      service: 'lms-backend',
      version: env.APP_VERSION,
      timestamp: new Date().toISOString(),
      success: true,
      message: 'API is running',
    });
  }

  res.status(200).json({
    success: true,
    message: 'API is running',
  });
};

/**
 * Readiness probe for Kubernetes / load balancers
 * Verifies critical backing dependencies (MongoDB)
 * @route GET /api/v1/ready
 */
const getReadiness = (req, res) => {
  const isDbConnected = mongoose.connection && mongoose.connection.readyState === 1;

  if (!isDbConnected && env.isProduction) {
    return res.status(503).json({
      success: false,
      status: 'NOT_READY',
      message: 'Database connection is unavailable',
    });
  }

  res.status(200).json({
    success: true,
    status: 'READY',
    database: isDbConnected ? 'CONNECTED' : 'DISCONNECTED',
    version: env.APP_VERSION,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Liveness probe for process supervision
 * @route GET /api/v1/live
 */
const getLiveness = (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ALIVE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  getHealth,
  getReadiness,
  getLiveness,
};
