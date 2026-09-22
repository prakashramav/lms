const { Course } = require('../models/course.model');
const { JobApplication } = require('../models/application.model');
const Resume = require('../models/resume.model');
const Portfolio = require('../models/portfolio.model');
const Job = require('../models/job.model');
const Company = require('../models/company.model');

/**
 * Resource-Level Authorization & IDOR Prevention Middleware
 * Phase 15 — Security Hardening (Sections 57 - 60)
 */

/**
 * Validates course ownership: requesting user must be the course instructor or an ADMIN
 */
const requireCourseOwnership = async (req, res, next) => {
  try {
    if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return next();
    }

    const courseId = req.params.courseId || req.params.id;
    if (!courseId) return next();

    const course = await Course.findById(courseId).select('instructor').lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found',
        },
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_RESOURCE_ACCESS',
          message: 'You are not authorized to modify or access this course',
          details: { courseId },
        },
        errorCode: 'FORBIDDEN',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates student resource ownership (Resume, Portfolio, Applications)
 */
const requireStudentResourceOwnership = (resourceType = 'RESUME') => {
  return async (req, res, next) => {
    try {
      if (['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
        return next();
      }

      const resourceId = req.params.id || req.params.resumeId || req.params.applicationId;
      if (!resourceId) return next();

      let ownerId = null;

      if (resourceType === 'RESUME') {
        const resume = await Resume.findById(resourceId).select('studentId').lean();
        if (resume) ownerId = resume.studentId;
      } else if (resourceType === 'PORTFOLIO') {
        const portfolio = await Portfolio.findById(resourceId).select('studentId').lean();
        if (portfolio) ownerId = portfolio.studentId;
      } else if (resourceType === 'APPLICATION') {
        const application = await JobApplication.findById(resourceId).select('studentId').lean();
        if (application) ownerId = application.studentId;
      }

      if (ownerId && ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN_RESOURCE_ACCESS',
            message: `You do not have permission to access or modify this ${resourceType.toLowerCase()}`,
            details: { resourceId },
          },
          errorCode: 'FORBIDDEN',
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = {
  requireCourseOwnership,
  requireStudentResourceOwnership,
};
