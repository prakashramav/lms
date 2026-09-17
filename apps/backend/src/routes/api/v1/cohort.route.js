const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');
const {
  listCohorts,
  createCohort,
  enrollStudents,
  getCohortDashboard,
  compareCohorts,
} = require('../../../controllers/cohort.controller');

const router = express.Router();

router.use(authenticate);

// View cohorts (Students in cohort or instructors/admins)
router.get('/', listCohorts);
router.get('/:cohortId/dashboard', getCohortDashboard);

// Manage cohorts (Instructor or Admin)
router.post('/', authorize('instructor', 'admin'), createCohort);
router.post('/:cohortId/enroll', authorize('instructor', 'admin'), enrollStudents);
router.post('/compare', authorize('instructor', 'admin'), compareCohorts);

module.exports = router;
