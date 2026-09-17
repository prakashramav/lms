const { getComprehensiveStudentProfile } = require('../services/personalization/studentProfileService');
const { getSmartContinueLearning, getAdaptiveRemediation } = require('../services/personalization/learningRecommendationService');
const { getCareerSkillGap } = require('../services/personalization/careerRecommendationService');
const { getRecommendedProjects, getRecommendedCourses, getRecommendedPractice } = require('../services/personalization/contentRecommendationService');
const { getWeeklyLearningReport, checkAndAwardAchievements } = require('../services/personalization/engagementService');
const { handleCoachInteraction } = require('../services/ai/aiCoach.service');

const getStudentProfile = async (req, res, next) => {
  try {
    const profile = await getComprehensiveStudentProfile(req.user._id);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

const getContinueLearning = async (req, res, next) => {
  try {
    const action = await getSmartContinueLearning(req.user._id);
    res.status(200).json({ success: true, action });
  } catch (err) {
    next(err);
  }
};

const getCareerGap = async (req, res, next) => {
  try {
    const { roleSlug } = req.query;
    const gap = await getCareerSkillGap(req.user._id, roleSlug);
    res.status(200).json({ success: true, gap });
  } catch (err) {
    next(err);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const [projects, courses, practice] = await Promise.all([
      getRecommendedProjects(req.user._id),
      getRecommendedCourses(req.user._id),
      getRecommendedPractice(req.user._id),
    ]);
    res.status(200).json({
      success: true,
      recommendations: {
        projects,
        courses,
        practice,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getWeeklyReport = async (req, res, next) => {
  try {
    const report = await getWeeklyLearningReport(req.user._id);
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

const postCoachQuery = async (req, res, next) => {
  try {
    const { mode, prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    const result = await handleCoachInteraction({
      studentId: req.user._id,
      mode,
      prompt,
      context,
    });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentProfile,
  getContinueLearning,
  getCareerGap,
  getRecommendations,
  getWeeklyReport,
  postCoachQuery,
};
