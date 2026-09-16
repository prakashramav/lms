const enrollmentService = require('../services/enrollment.service');

/**
 * Enroll student in course
 * @route POST /api/v1/enrollments
 */
const enroll = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required for enrollment.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const { enrollment, isNew } = await enrollmentService.enrollInCourse(req.user._id, courseId);

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Successfully enrolled in course.' : 'Already enrolled in course.',
      data: { enrollment },
    });
  } catch (error) {
    if (error.message === 'COURSE_UNAVAILABLE') {
      return res.status(404).json({
        success: false,
        message: 'Course is not available for enrollment.',
        errorCode: 'COURSE_UNAVAILABLE',
      });
    }
    next(error);
  }
};

/**
 * Get all enrollments for logged in student
 * @route GET /api/v1/enrollments
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await enrollmentService.getStudentEnrollments(req.user._id);

    res.status(200).json({
      success: true,
      data: { enrollments },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student enrollment status for specific course
 * @route GET /api/v1/enrollments/:courseId
 */
const getCourseEnrollment = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.getEnrollmentByCourse(req.user._id, req.params.courseId);

    res.status(200).json({
      success: true,
      data: {
        isEnrolled: !!enrollment,
        enrollment: enrollment || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enroll,
  getMyEnrollments,
  getCourseEnrollment,
};
