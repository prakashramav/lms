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

// Learning player curriculum requires authentication
router.get('/:courseId/curriculum', authenticate, getCurriculum);

module.exports = router;
