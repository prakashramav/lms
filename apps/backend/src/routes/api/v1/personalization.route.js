const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  getStudentProfile,
  getContinueLearning,
  getCareerGap,
  getRecommendations,
  getWeeklyReport,
  postCoachQuery,
  getLearningPath,
  getSkillGapsEndpoint,
  getNextAction,
  getDailyPlanEndpoint,
  postFeedback,
  postOnboarding,
  postReset,
} = require('../../../controllers/personalization.controller');

const router = express.Router();

// Enforce authentication for all personalization routes
router.use(authenticate);

// Legacy & Phase 14 Routes
router.get('/profile', getStudentProfile);
router.get('/continue-learning', getContinueLearning);
router.get('/career-gap', getCareerGap);
router.get('/recommendations', getRecommendations);
router.get('/weekly-report', getWeeklyReport);
router.post('/coach', postCoachQuery);

// Phase 24 Endpoints
router.get('/learning-path', getLearningPath);
router.get('/skill-gaps', getSkillGapsEndpoint);
router.get('/next-action', getNextAction);
router.get('/daily-plan', getDailyPlanEndpoint);
router.post('/feedback', postFeedback);
router.post('/onboarding', postOnboarding);
router.post('/reset', postReset);

module.exports = router;
