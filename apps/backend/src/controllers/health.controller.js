/**
 * Health check controller
 * @route GET /api/v1/health
 */
const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
  });
};

module.exports = {
  getHealth,
};
