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

// ================= PHASE 12: CAREER INTELLIGENCE & PLACEMENT =================
const careerController = require('../../../controllers/career.controller');

// Career Profile, Roadmap & Skill Gaps
router.get('/career-profile', authenticate, authorize('STUDENT'), careerController.getStudentCareerProfile);
router.post('/career-profile/target', authenticate, authorize('STUDENT'), careerController.updateTargetCareer);
router.get('/skill-gaps', authenticate, authorize('STUDENT'), careerController.getStudentSkillGaps);

// Career Plan
router.get('/career-plan', authenticate, authorize('STUDENT'), careerController.getStudentCareerPlan);
router.patch('/career-plan', authenticate, authorize('STUDENT'), careerController.updateCareerPlan);
router.post('/career-plan/milestones/toggle', authenticate, authorize('STUDENT'), careerController.toggleMilestone);
router.get('/career-analytics', authenticate, authorize('STUDENT'), careerController.getStudentCareerAnalytics);

// Saved Jobs
router.get('/saved-jobs', authenticate, authorize('STUDENT'), careerController.getSavedJobs);

// Applications
router.get('/applications', authenticate, authorize('STUDENT'), careerController.getStudentApplications);
router.post('/applications', authenticate, authorize('STUDENT'), careerController.applyToJob);
router.get('/applications/:applicationId', authenticate, authorize('STUDENT'), careerController.getApplicationById);
router.patch('/applications/:applicationId', authenticate, authorize('STUDENT'), careerController.updateApplicationStatus);
router.patch('/applications/:applicationId/notes', authenticate, authorize('STUDENT'), careerController.updateStudentNotes);

// Resumes
router.get('/resumes', authenticate, authorize('STUDENT'), careerController.getStudentResumes);
router.post('/resumes', authenticate, authorize('STUDENT'), careerController.createResume);
router.get('/resumes/:resumeId', authenticate, authorize('STUDENT'), careerController.getResumeById);
router.patch('/resumes/:resumeId', authenticate, authorize('STUDENT'), careerController.updateResume);
router.delete('/resumes/:resumeId', authenticate, authorize('STUDENT'), careerController.deleteResume);
router.post('/resumes/:resumeId/analyze', authenticate, authorize('STUDENT'), careerController.analyzeResume);
router.post('/resumes/:resumeId/restore', authenticate, authorize('STUDENT'), careerController.restoreResumeVersion);

// Portfolio
router.get('/portfolio', authenticate, authorize('STUDENT'), careerController.getStudentPortfolio);
router.patch('/portfolio', authenticate, authorize('STUDENT'), careerController.updatePortfolio);

module.exports = router;

