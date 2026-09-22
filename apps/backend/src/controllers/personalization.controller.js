const { getComprehensiveStudentProfile } = require('../services/personalization/studentProfileService');
const { getSmartContinueLearning, getAdaptiveRemediation } = require('../services/personalization/learningRecommendationService');
const { getCareerSkillGap } = require('../services/personalization/careerRecommendationService');
const { getRecommendedProjects, getRecommendedCourses, getRecommendedPractice } = require('../services/personalization/contentRecommendationService');
const { getWeeklyLearningReport, checkAndAwardAchievements } = require('../services/personalization/engagementService');
const { handleCoachInteraction } = require('../services/ai/aiCoach.service');
const {
  generateLearningPath,
  getSkillGaps,
  getNextBestAction,
  getDailyPlan,
  recordFeedback,
  handleOnboarding,
  resetProfile,
} = require('../services/personalization/learningPathService');

/**
 * 1. Comprehensive Student Profile
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const profile = await getComprehensiveStudentProfile(req.user._id);
    res.status(200).json({ success: true, profile });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Smart Continue Learning Action
 */
const getContinueLearning = async (req, res, next) => {
  try {
    const action = await getSmartContinueLearning(req.user._id);
    res.status(200).json({ success: true, action });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Career Skill Gap (Legacy & CareerPath Slug)
 */
const getCareerGap = async (req, res, next) => {
  try {
    const { roleSlug } = req.query;
    const gap = await getCareerSkillGap(req.user._id, roleSlug);
    res.status(200).json({ success: true, gap });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Multi-Domain Recommendations
 */
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

/**
 * 5. Weekly Learning Velocity Report
 */
const getWeeklyReport = async (req, res, next) => {
  try {
    const report = await getWeeklyLearningReport(req.user._id);
    res.status(200).json({ success: true, report });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. AI Learning Coach Interaction
 */
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

/**
 * 7. Phase 24: Dynamic Learning Path with Prerequisite Validation
 */
const getLearningPath = async (req, res, next) => {
  try {
    const { goal = 'full-stack-developer' } = req.query;
    const pathData = await generateLearningPath(req.user._id, goal);
    res.status(200).json({ success: true, data: pathData });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Phase 24: Skill Gaps Analysis
 */
const getSkillGapsEndpoint = async (req, res, next) => {
  try {
    const { goal = 'full-stack-developer' } = req.query;
    const gaps = await getSkillGaps(req.user._id, goal);
    res.status(200).json({ success: true, data: gaps });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. Phase 24: Next Best Action
 */
const getNextAction = async (req, res, next) => {
  try {
    const action = await getNextBestAction(req.user._id);
    res.status(200).json({ success: true, data: action });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. Phase 24: Daily Learning Plan
 */
const getDailyPlanEndpoint = async (req, res, next) => {
  try {
    const plan = await getDailyPlan(req.user._id);
    res.status(200).json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. Phase 24: Recommendation User Feedback
 */
const postFeedback = async (req, res, next) => {
  try {
    const { recommendationId, feedback, reason } = req.body;
    const result = await recordFeedback(req.user._id, { recommendationId, feedback, reason });
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * 12. Phase 24: Cold-Start Onboarding Handler
 */
const postOnboarding = async (req, res, next) => {
  try {
    const result = await handleOnboarding(req.user._id, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

/**
 * 13. Phase 24: Safe Profile Reset & Rebuild
 */
const postReset = async (req, res, next) => {
  try {
    const result = await resetProfile(req.user._id);
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
  getLearningPath,
  getSkillGapsEndpoint,
  getNextAction,
  getDailyPlanEndpoint,
  postFeedback,
  postOnboarding,
  postReset,
};
