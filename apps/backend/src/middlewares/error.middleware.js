const env = require('../config/env');

/**
 * Centralized Express Error Middleware
 * Normalizes error responses, assigns request tracking IDs,
 * maps Mongoose/JWT errors, and hides sensitive stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  const requestId = req.id || req.requestId || 'unknown';

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const fields = Object.values(err.errors || {}).map((e) => e.message);
    message = fields.length > 0 ? fields.join(', ') : 'Validation failed';
  }

  // Handle Mongoose Cast Errors (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_RESOURCE_ID';
    message = `Invalid format for resource identifier: ${err.value}`;
  }

  // Handle MongoDB Duplicate Key Errors
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY_ERROR';
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A resource with that ${field} already exists.`;
  }

  // Handle JWT Verification Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Log error with context in non-test mode
  if (!env.isTest) {
    console.error(`[Error] [ReqID: ${requestId}] ${req.method} ${req.originalUrl}:`, {
      statusCode,
      errorCode,
      message: err.message,
      ...(env.isDevelopment && { stack: err.stack }),
    });
  }

  // Production Error Masking: Never leak 500 stack traces or raw internal exception messages
  if (env.isProduction && statusCode === 500) {
    return res.status(500).json({
      success: false,
      error: 'Something went wrong.',
      message: 'Something went wrong.',
      errorCode: 'INTERNAL_SERVER_ERROR',
      code: 'INTERNAL_ERROR',
      requestId,
    });
  }

  // Standard JSON response
  res.status(statusCode).json({
    success: false,
    error: message,
    message,
    errorCode,
    code: errorCode,
    requestId,
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

module.exports = errorHandler;
