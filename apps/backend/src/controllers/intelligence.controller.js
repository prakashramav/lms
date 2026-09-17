const intelligenceService = require('../services/intelligence/intelligence.service');
const recommendationService = require('../services/intelligence/recommendation.service');
const studyPlanService = require('../services/intelligence/studyPlan.service');
const goalService = require('../services/intelligence/goal.service');
const revisionService = require('../services/intelligence/revision.service');
const mistakeService = require('../services/intelligence/mistake.service');
const achievementService = require('../services/intelligence/achievement.service');
const weeklyReviewService = require('../services/intelligence/weeklyReview.service');
const instructorIntelligenceService = require('../services/intelligence/instructorIntelligence.service');
const { AdminIntelligenceService } = require('../services/intelligence/adminIntelligence.service');
const { LearningProfile } = require('../models/learningProfile.model');

// Student controllers
const getLearningProfile = async (req, res, next) => {
  try {
    const profile = await intelligenceService.getOrCreateProfile(req.user._id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

const getSkills = async (req, res, next) => {
  try {
    const skills = await intelligenceService.getStudentSkills(req.user._id);
    res.status(200).json({ success: true, data: skills });
  } catch (error) {
    next(error);
  }
};

const getWeakTopics = async (req, res, next) => {
  try {
    const weakTopics = await intelligenceService.detectWeakTopics(req.user._id);
    res.status(200).json({ success: true, data: weakTopics });
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user._id);
    res.status(200).json({ success: true, data: { recommendations } });
  } catch (error) {
    next(error);
  }
};

const submitRecommendationFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const normalizedRating = (rating || 'HELPFUL').toUpperCase();
    const rec = await recommendationService.submitFeedback(req.user._id, id, normalizedRating);
    res.status(200).json({ success: true, data: rec });
  } catch (error) {
    next(error);
  }
};

const dismissRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rec = await recommendationService.dismissRecommendation(req.user._id, id);
    res.status(200).json({ success: true, data: rec });
  } catch (error) {
    next(error);
  }
};

const getDailyPlan = async (req, res, next) => {
  try {
    const plan = await studyPlanService.getTodayPlan(req.user._id);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const generateDailyPlan = async (req, res, next) => {
  try {
    const plan = await studyPlanService.generateDailyPlan(req.user._id);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const updateDailyTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { isCompleted } = req.body;
    const plan = await studyPlanService.updateTaskStatus(req.user._id, taskId, isCompleted);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const getGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getGoals(req.user._id, req.query);
    res.status(200).json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.user._id, req.body);
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const goal = await goalService.updateGoal(req.user._id, goalId, req.body);
    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    await goalService.deleteGoal(req.user._id, goalId);
    res.status(200).json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getRevisionQueue = async (req, res, next) => {
  try {
    const dueReviews = await revisionService.getDueRevisions(req.user._id);
    res.status(200).json({ success: true, data: { dueReviews } });
  } catch (error) {
    next(error);
  }
};

const completeRevisionTopic = async (req, res, next) => {
  try {
    const { topicId } = req.params;
    const { performance } = req.body;
    const score = performance === 'EASY' ? 100 : performance === 'GOOD' ? 80 : 50;
    const updated = await revisionService.completeRevision(req.user._id, topicId, { performanceScore: score });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

const getMistakes = async (req, res, next) => {
  try {
    const mistakes = await mistakeService.getMistakes(req.user._id, req.query);
    res.status(200).json({ success: true, data: { mistakes } });
  } catch (error) {
    next(error);
  }
};

const getMistakeById = async (req, res, next) => {
  try {
    const { mistakeId } = req.params;
    const mistake = await mistakeService.getMistakeById(req.user._id, mistakeId);
    res.status(200).json({ success: true, data: mistake });
  } catch (error) {
    next(error);
  }
};

const retryMistake = async (req, res, next) => {
  try {
    const { mistakeId } = req.params;
    const resolved = await mistakeService.retryMistake(req.user._id, mistakeId, { isCorrect: true });
    res.status(200).json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
};

const getAchievements = async (req, res, next) => {
  try {
    const achievements = await achievementService.getStudentAchievements(req.user._id);
    res.status(200).json({ success: true, data: achievements });
  } catch (error) {
    next(error);
  }
};

const getWeeklyReview = async (req, res, next) => {
  try {
    const review = await weeklyReviewService.getWeeklyReview(req.user._id);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const getLearningSettings = async (req, res, next) => {
  try {
    const profile = await intelligenceService.getOrCreateProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: profile.preferences || {
        personalizedRecommendations: true,
        aiTutorContext: true,
        learningReminders: true,
        weeklyReview: true,
        adaptivePractice: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateLearningSettings = async (req, res, next) => {
  try {
    const profile = await intelligenceService.getOrCreateProfile(req.user._id);
    profile.preferences = {
      ...profile.preferences,
      ...req.body,
    };
    await profile.save();
    res.status(200).json({ success: true, data: profile.preferences });
  } catch (error) {
    next(error);
  }
};

// Instructor controllers
const getCourseIntelligence = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const data = await instructorIntelligenceService.getCourseIntelligence(courseId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCourseWeakTopics = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const data = await instructorIntelligenceService.getCourseWeakTopics(courseId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getCourseCommonMistakes = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const data = await instructorIntelligenceService.getCourseCommonMistakes(courseId, req.user._id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Admin controllers
const getPlatformLearningHealth = async (req, res, next) => {
  try {
    const data = await AdminIntelligenceService.getPlatformLearningHealth();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getAdminRecommendations = async (req, res, next) => {
  try {
    const data = await AdminIntelligenceService.getRecommendationAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getAdminEngagement = async (req, res, next) => {
  try {
    const data = await AdminIntelligenceService.getEngagementAnalytics();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLearningProfile,
  getSkills,
  getWeakTopics,
  getRecommendations,
  submitRecommendationFeedback,
  dismissRecommendation,
  getDailyPlan,
  generateDailyPlan,
  updateDailyTask,
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  getRevisionQueue,
  completeRevisionTopic,
  getMistakes,
  getMistakeById,
  retryMistake,
  getAchievements,
  getWeeklyReview,
  getLearningSettings,
  updateLearningSettings,
  getCourseIntelligence,
  getCourseWeakTopics,
  getCourseCommonMistakes,
  getPlatformLearningHealth,
  getAdminRecommendations,
  getAdminEngagement,
};
