const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { optionalAuthenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/:username', optionalAuthenticate, careerController.getPublicPortfolio);

module.exports = router;
