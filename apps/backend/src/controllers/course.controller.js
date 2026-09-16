const courseService = require('../services/course.service');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models/user.model');

// Helper to optionally extract authenticated user from token if present on public routes
const extractOptionalUser = async (req) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    if (!token) return null;
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return await User.findById(decoded.userId);
  } catch (e) {
    return null;
  }
};

/**
 * Get courses catalog with pagination, search, and filters
 * @route GET /api/v1/courses
 */
const getCoursesList = async (req, res, next) => {
  try {
    const user = await extractOptionalUser(req);
    const result = await courseService.getCourses({
      ...req.query,
      user,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single course by slug
 * @route GET /api/v1/courses/:slug
 */
const getCourseDetails = async (req, res, next) => {
  try {
    const user = await extractOptionalUser(req);
    const course = await courseService.getCourseBySlug(req.params.slug, user);

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or is currently not published.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }
    next(error);
  }
};

/**
 * Get course curriculum for learning player
 * @route GET /api/v1/courses/:courseId/curriculum
 */
const getCurriculum = async (req, res, next) => {
  try {
    const result = await courseService.getCourseCurriculum(req.params.courseId, req.user);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.message === 'COURSE_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Course not found or unavailable.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }
    next(error);
  }
};

module.exports = {
  getCoursesList,
  getCourseDetails,
  getCurriculum,
};
