const express = require('express');
const rateLimit = require('express-rate-limit');
const { practiceController } = require('../../../controllers/practice.controller');
const { authenticate, optionalAuthenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Strict execution rate limiter: max 30 code executions per minute per user/IP
const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Execution rate limit exceeded. Please wait a few seconds before running more code.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

// Strict submission rate limiter: max 15 submissions per minute per user/IP
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Submission rate limit exceeded. Please wait a few seconds before submitting again.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

// Languages
router.get('/languages', practiceController.getLanguages);
router.get('/languages/all', practiceController.getAllLanguages);

// Problem catalog & details
router.get('/problems', optionalAuthenticate, practiceController.getProblems);
router.get('/problems/:slug', optionalAuthenticate, practiceController.getProblemBySlug);

// Execution & Submissions
router.post(
  '/problems/:problemId/run',
  executionLimiter,
  optionalAuthenticate,
  practiceController.runCode
);
router.post(
  '/problems/:problemId/submit',
  submissionLimiter,
  authenticate,
  authorize('STUDENT'),
  practiceController.submitCode
);

// Execution status & cancellation
router.get('/executions/:executionId', practiceController.getExecutionStatus);
router.post('/executions/:executionId/cancel', authenticate, practiceController.cancelExecution);

// Code drafts
router.get('/drafts/:problemId', authenticate, practiceController.getDraft);
router.put('/drafts/:problemId', authenticate, practiceController.saveDraft);

// Bookmarks
router.post('/problems/:problemId/bookmark', authenticate, practiceController.toggleBookmark);
router.delete('/problems/:problemId/bookmark', authenticate, practiceController.toggleBookmark);
router.get('/bookmarks', authenticate, practiceController.getBookmarks);

// Submission history
router.get('/submissions', authenticate, practiceController.getSubmissions);
router.get('/submissions/:submissionId', authenticate, practiceController.getSubmissionDetail);

// Student practice progress & statistics
router.get('/progress', authenticate, practiceController.getProgress);

module.exports = router;
