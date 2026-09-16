const express = require('express');
const {
  getAssessments,
  getAssessmentById,
} = require('../../../controllers/assessment.controller');
const {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getAttemptReview,
  getStudentHistory,
} = require('../../../controllers/attempt.controller');
const {
  authenticate,
  authorize,
  optionalAuthenticate,
} = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Assessment History
router.get('/history', authenticate, authorize('STUDENT'), getStudentHistory);

// Attempt actions (before :assessmentId route parameter)
router.get('/attempts/:attemptId', authenticate, authorize('STUDENT'), getAttempt);
router.patch('/attempts/:attemptId/answers', authenticate, authorize('STUDENT'), saveAnswer);
router.post('/attempts/:attemptId/submit', authenticate, authorize('STUDENT'), submitAttempt);
router.get('/attempts/:attemptId/result', authenticate, authorize('STUDENT'), getAttemptResult);
router.get('/attempts/:attemptId/review', authenticate, authorize('STUDENT'), getAttemptReview);

// Catalog listing
router.get('/', optionalAuthenticate, getAssessments);

// Specific assessment operations
router.get('/:assessmentId', optionalAuthenticate, getAssessmentById);
router.post('/:assessmentId/attempts', authenticate, authorize('STUDENT'), startAttempt);

module.exports = router;
