const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { authenticate, optionalAuthenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/', optionalAuthenticate, careerController.searchJobs);
router.get('/:jobId', optionalAuthenticate, careerController.getJobById);
router.post('/:jobId/save', authenticate, careerController.saveJob);
router.delete('/:jobId/save', authenticate, careerController.unsaveJob);
router.post('/:jobId/report', authenticate, careerController.reportJob);

module.exports = router;
