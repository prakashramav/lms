const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Employer or Admin can access employer routes
router.use(authenticate);
router.use(authorize('ADMIN', 'INSTRUCTOR', 'STUDENT')); // allow active platform users to test/manage employer profile

router.get('/company', careerController.getEmployerCompany);
router.patch('/company', careerController.updateEmployerCompany);
router.post('/jobs', careerController.createEmployerJob);
router.get('/applications', careerController.getJobApplicationsForEmployer);
router.patch('/applications/:applicationId', careerController.employerUpdateApplicationStatus);

module.exports = router;
