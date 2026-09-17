const express = require('express');
const {
  getCoursesList,
  getCourseDetails,
  getCurriculum,
} = require('../../../controllers/course.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

// Public / optionally authenticated routes
router.get('/', getCoursesList);
router.get('/:slug', getCourseDetails);

// Learning player curriculum routes (supports both /curriculum and /modules)
router.get('/:courseId/curriculum', getCurriculum);
router.get('/:courseId/modules', getCurriculum);

module.exports = router;
