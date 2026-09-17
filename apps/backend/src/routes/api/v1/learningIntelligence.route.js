const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  getKnowledgeProfile,
  addSkillEvidence,
  setSelfReportedSkill,
  getSkillDependencies,
  getPersonalizedRoadmap,
  getDailyLearningPlan,
} = require('../../../controllers/learningIntelligence.controller');

const router = express.Router();

router.use(authenticate);

router.get('/profile', getKnowledgeProfile);
router.post('/evidence', addSkillEvidence);
router.post('/self-reported', setSelfReportedSkill);
router.get('/dependencies/:skillSlug', getSkillDependencies);
router.get('/roadmap', getPersonalizedRoadmap);
router.get('/daily-plan', getDailyLearningPlan);

module.exports = router;
