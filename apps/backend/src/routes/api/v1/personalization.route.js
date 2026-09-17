const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  getStudentProfile,
  getContinueLearning,
  getCareerGap,
  getRecommendations,
  getWeeklyReport,
  postCoachQuery,
} = require('../../../controllers/personalization.controller');

const router = express.Router();

router.use(authenticate);

router.get('/profile', getStudentProfile);
router.get('/continue-learning', getContinueLearning);
router.get('/career-gap', getCareerGap);
router.get('/recommendations', getRecommendations);
router.get('/weekly-report', getWeeklyReport);
router.post('/coach', postCoachQuery);

module.exports = router;
