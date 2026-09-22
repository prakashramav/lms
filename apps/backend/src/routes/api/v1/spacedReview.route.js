const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  getDueItems,
  recordReviewAttempt,
  getMistakes,
  logMistake,
  resolveMistake,
} = require('../../../controllers/spacedReview.controller');

const router = express.Router();

router.use(authenticate);

router.get('/due', getDueItems);
router.post('/attempt', recordReviewAttempt);
router.get('/mistakes', getMistakes);
router.post('/mistakes', logMistake);
router.patch('/mistakes/:mistakeId/resolve', resolveMistake);

module.exports = router;
