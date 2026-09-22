const express = require('express');
const {
  getCoursesList,
  getCourseDetails,
  getCurriculum,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
} = require('../../../controllers/course.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Public / optionally authenticated discovery routes
router.get('/', getCoursesList);
router.get('/:slug', getCourseDetails);

// Learning player curriculum routes (supports both /curriculum and /modules)
router.get('/:courseId/curriculum', getCurriculum);
router.get('/:courseId/modules', getCurriculum);

// Secure Course Lifecycle Actions (Instructor for own course, Admin for any course)
router.post('/:courseId/publish', authenticate, publishCourse);
router.post('/:courseId/unpublish', authenticate, unpublishCourse);
router.post('/:courseId/archive', authenticate, archiveCourse);
router.delete('/:courseId', authenticate, deleteCourse);

module.exports = router;
