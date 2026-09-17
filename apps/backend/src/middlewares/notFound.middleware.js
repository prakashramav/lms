const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
    requestId: req.id || req.requestId || 'unknown',
  });
};

module.exports = notFound;
