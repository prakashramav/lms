const express = require('express');
const {
  enroll,
  getMyEnrollments,
  getCourseEnrollment,
} = require('../../../controllers/enrollment.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

router.post('/', enroll);
router.get('/', getMyEnrollments);
router.get('/:courseId', getCourseEnrollment);

module.exports = router;
