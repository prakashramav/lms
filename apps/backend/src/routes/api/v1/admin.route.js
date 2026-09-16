const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Admin-only overview endpoint
router.get('/overview', authenticate, authorize('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Admin Governance API',
    data: {
      user: req.user,
      systemStatus: 'OPERATIONAL',
      activeSandboxes: 4,
    },
  });
});

module.exports = router;
