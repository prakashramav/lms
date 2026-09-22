const courseService = require('../services/course.service');
const instructorCourseService = require('../services/instructor/course.service');
const adminCourseService = require('../services/admin/admin.course.service');
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
      courses: result.courses,
      data: result,
      pagination: result.pagination,
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

const courseDeletionService = require('../services/course.deletion.service');

/**
 * Get course curriculum for learning player
 * @route GET /api/v1/courses/:courseId/curriculum
 */
const getCurriculum = async (req, res, next) => {
  try {
    const user = req.user || (await extractOptionalUser(req));
    const result = await courseService.getCourseCurriculum(req.params.courseId, user);

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

/**
 * Delete a course
 * @route DELETE /api/v1/courses/:courseId
 */
const deleteCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const result = await courseDeletionService.deleteCourse(courseId, req.user, {
      reason: req.body?.reason,
    });

    res.status(200).json(result);
  } catch (error) {
    if (error.code === 'INVALID_COURSE_ID' || error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_COURSE_ID',
        errorCode: 'INVALID_COURSE_ID',
        message: error.message || 'Invalid course ID.',
      });
    }
    if (error.code === 'COURSE_NOT_FOUND' || error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        code: 'COURSE_NOT_FOUND',
        errorCode: 'COURSE_NOT_FOUND',
        message: 'Course not found.',
      });
    }
    if (error.code === 'COURSE_DELETE_FORBIDDEN' || error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        code: 'COURSE_DELETE_FORBIDDEN',
        errorCode: 'COURSE_DELETE_FORBIDDEN',
        message: error.message || 'You are not authorized to delete this course.',
      });
    }
    if (error.code === 'UNAUTHORIZED' || error.statusCode === 401) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        errorCode: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }
    next(error);
  }
};

/**
 * Publish a course (Instructor owns course, or Admin)
 * @route POST /api/v1/courses/:courseId/publish
 */
const publishCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userRole = (req.user?.role || '').toUpperCase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    if (userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot publish courses.',
        errorCode: 'FORBIDDEN',
      });
    }

    let publishedCourse;
    if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      publishedCourse = await adminCourseService.publishCourse(courseId, req.user, req);
    } else if (userRole === 'INSTRUCTOR') {
      publishedCourse = await instructorCourseService.publishCourse(courseId, req.user._id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions to publish courses.',
        errorCode: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course published successfully',
      course: {
        id: publishedCourse._id,
        title: publishedCourse.title,
        slug: publishedCourse.slug,
        status: (publishedCourse.status || 'PUBLISHED').toLowerCase(),
        publishedAt: publishedCourse.publishedAt,
        publishedBy: publishedCourse.publishedBy,
        publishedByRole: (publishedCourse.publishedByRole || (userRole === 'INSTRUCTOR' ? 'instructor' : 'admin')).toLowerCase(),
      },
      data: publishedCourse,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.message === 'Course not found.') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }
    if (error.statusCode === 403 || error.message.includes('Forbidden')) {
      return res.status(403).json({
        success: false,
        message: error.message || 'Forbidden. You do not own this course.',
        errorCode: 'FORBIDDEN',
      });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: error.validationErrors || [error.message],
        errorCode: 'VALIDATION_ERROR',
      });
    }
    next(error);
  }
};

/**
 * Unpublish a course
 * @route POST /api/v1/courses/:courseId/unpublish
 */
const unpublishCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userRole = (req.user?.role || '').toUpperCase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    if (userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot unpublish courses.',
        errorCode: 'FORBIDDEN',
      });
    }

    let course;
    if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      course = await adminCourseService.unpublishCourse(courseId, { reason: req.body?.reason || 'Unpublished' }, req.user, req);
    } else if (userRole === 'INSTRUCTOR') {
      course = await instructorCourseService.unpublishCourse(courseId, req.user._id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        errorCode: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course unpublished successfully',
      course: {
        id: course._id,
        status: (course.status || 'DRAFT').toLowerCase(),
        isPublished: course.isPublished,
      },
      data: course,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.message === 'Course not found.') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }
    if (error.statusCode === 403 || error.message.includes('Forbidden')) {
      return res.status(403).json({
        success: false,
        message: error.message || 'Forbidden. You do not own this course.',
        errorCode: 'FORBIDDEN',
      });
    }
    next(error);
  }
};

/**
 * Archive a course
 * @route POST /api/v1/courses/:courseId/archive
 */
const archiveCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const userRole = (req.user?.role || '').toUpperCase();

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      });
    }

    if (userRole === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Students cannot archive courses.',
        errorCode: 'FORBIDDEN',
      });
    }

    let course;
    if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      course = await adminCourseService.archiveCourse(courseId, req.user, req);
    } else if (userRole === 'INSTRUCTOR') {
      course = await instructorCourseService.archiveCourse(courseId, req.user._id);
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        errorCode: 'FORBIDDEN',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course archived successfully',
      course: {
        id: course._id,
        status: (course.status || 'ARCHIVED').toLowerCase(),
        isPublished: course.isPublished,
      },
      data: course,
    });
  } catch (error) {
    if (error.statusCode === 404 || error.message === 'Course not found.') {
      return res.status(404).json({
        success: false,
        message: error.message || 'Course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }
    if (error.statusCode === 403 || error.message.includes('Forbidden')) {
      return res.status(403).json({
        success: false,
        message: error.message || 'Forbidden. You do not own this course.',
        errorCode: 'FORBIDDEN',
      });
    }
    next(error);
  }
};

module.exports = {
  getCoursesList,
  getCourseDetails,
  getCurriculum,
  deleteCourse,
  publishCourse,
  unpublishCourse,
  archiveCourse,
};
