const express = require('express');
const { getDashboard } = require('../../../controllers/studentDashboard.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Protected student dashboard endpoint (Role STUDENT required)
router.get('/dashboard', authenticate, authorize('STUDENT'), getDashboard);

module.exports = router;
