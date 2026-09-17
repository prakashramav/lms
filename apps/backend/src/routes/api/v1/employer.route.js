const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Employer or Admin can access employer routes
router.use(authenticate);
router.use(authorize('ADMIN', 'INSTRUCTOR', 'STUDENT')); // allow active platform users to test/manage employer profile

const { getPipelineBoard, updateApplicationStage } = require('../../../services/employer/employerIntelligence');

router.get('/company', careerController.getEmployerCompany);
router.patch('/company', careerController.updateEmployerCompany);
router.post('/jobs', careerController.createEmployerJob);
router.get('/applications', careerController.getJobApplicationsForEmployer);
router.patch('/applications/:applicationId', careerController.employerUpdateApplicationStatus);

// Phase 14 ATS Kanban Board & Stage Management
router.get('/pipeline', async (req, res, next) => {
  try {
    const board = await getPipelineBoard(req.user._id, req.query.jobId);
    res.status(200).json({ success: true, ...board });
  } catch (err) {
    next(err);
  }
});

router.patch('/pipeline/:applicationId/stage', async (req, res, next) => {
  try {
    const { stage, note } = req.body;
    const application = await updateApplicationStage({
      applicationId: req.params.applicationId,
      newStage: stage,
      actorId: req.user._id,
      note,
    });
    res.status(200).json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
