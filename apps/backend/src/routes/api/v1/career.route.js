const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { optionalAuthenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/paths', optionalAuthenticate, careerController.getCareerPaths);
router.get('/paths/:slug', optionalAuthenticate, careerController.getCareerPathBySlug);
router.get('/roadmap/:careerPathId', optionalAuthenticate, careerController.getCareerRoadmap);
router.get('/resources', optionalAuthenticate, careerController.getCareerResources);

module.exports = router;
