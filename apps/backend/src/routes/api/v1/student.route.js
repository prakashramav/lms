const express = require('express');
const { getDashboard } = require('../../../controllers/studentDashboard.controller');
const intelligenceController = require('../../../controllers/intelligence.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Protected student dashboard endpoint (Role STUDENT required)
router.get('/dashboard', authenticate, authorize('STUDENT'), getDashboard);

// Phase 11: Learning Profile & Skills
router.get('/learning-profile', authenticate, authorize('STUDENT'), intelligenceController.getLearningProfile);
router.get('/skills', authenticate, authorize('STUDENT'), intelligenceController.getSkills);
router.get('/weak-topics', authenticate, authorize('STUDENT'), intelligenceController.getWeakTopics);

// Phase 11: Recommendations
router.get('/recommendations', authenticate, authorize('STUDENT'), intelligenceController.getRecommendations);
router.post('/recommendations/:id/feedback', authenticate, authorize('STUDENT'), intelligenceController.submitRecommendationFeedback);
router.post('/recommendations/:id/dismiss', authenticate, authorize('STUDENT'), intelligenceController.dismissRecommendation);

// Phase 11: Daily Study Plan
router.get('/daily-plan', authenticate, authorize('STUDENT'), intelligenceController.getDailyPlan);
router.post('/daily-plan/generate', authenticate, authorize('STUDENT'), intelligenceController.generateDailyPlan);
router.patch('/daily-plan/:taskId', authenticate, authorize('STUDENT'), intelligenceController.updateDailyTask);

// Phase 11: Goals
router.get('/goals', authenticate, authorize('STUDENT'), intelligenceController.getGoals);
router.post('/goals', authenticate, authorize('STUDENT'), intelligenceController.createGoal);
router.patch('/goals/:goalId', authenticate, authorize('STUDENT'), intelligenceController.updateGoal);
router.delete('/goals/:goalId', authenticate, authorize('STUDENT'), intelligenceController.deleteGoal);

// Phase 11: Revision
router.get('/revision', authenticate, authorize('STUDENT'), intelligenceController.getRevisionQueue);
router.post('/revision/:topicId/complete', authenticate, authorize('STUDENT'), intelligenceController.completeRevisionTopic);

// Phase 11: Mistakes
router.get('/mistakes', authenticate, authorize('STUDENT'), intelligenceController.getMistakes);
router.get('/mistakes/:mistakeId', authenticate, authorize('STUDENT'), intelligenceController.getMistakeById);
router.post('/mistakes/:mistakeId/retry', authenticate, authorize('STUDENT'), intelligenceController.retryMistake);

// Phase 11: Achievements
router.get('/achievements', authenticate, authorize('STUDENT'), intelligenceController.getAchievements);

// Phase 11: Weekly Review
router.get('/weekly-review', authenticate, authorize('STUDENT'), intelligenceController.getWeeklyReview);

// Phase 11: Learning Settings
router.get('/settings/learning', authenticate, authorize('STUDENT'), intelligenceController.getLearningSettings);
router.patch('/settings/learning', authenticate, authorize('STUDENT'), intelligenceController.updateLearningSettings);

module.exports = router;
