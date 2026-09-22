const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  submitFeedback,
  getFeedbackForTarget,
} = require('../../../controllers/feedback.controller');

const router = express.Router();

router.get('/', getFeedbackForTarget);

router.use(authenticate);
router.post('/', submitFeedback);

module.exports = router;
