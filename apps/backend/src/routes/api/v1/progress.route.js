const express = require('express');
const {
  getProgress,
  start,
  updateProgress,
  markComplete,
} = require('../../../controllers/progress.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

router.get('/:courseId', getProgress);
router.post('/lessons/:lessonId/start', start);
router.patch('/lessons/:lessonId', updateProgress);
router.post('/lessons/:lessonId/complete', markComplete);

module.exports = router;
