const mongoose = require('mongoose');
const { Course } = require('../models/course.model');
const Module = require('../models/module.model');
const { Lesson } = require('../models/lesson.model');
const Assessment = require('../models/assessment.model');
const { Problem } = require('../models/problem.model');

/**
 * Middleware to enforce that the logged-in user is the owner (instructor) of the course
 */
const requireCourseOwner = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID parameter is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    let course = null;
    if (mongoose.Types.ObjectId.isValid(courseId)) {
      course = await Course.findById(courseId);
    } else {
      course = await Course.findOne({ slug: courseId });
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    // Role check: Instructor must match course.instructor
    const isOwner = course.instructor && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to manage this course.',
        errorCode: 'FORBIDDEN_COURSE_ACCESS',
      });
    }

    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce ownership of a module via its parent course
 */
const requireModuleOwner = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Module ID parameter is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const moduleDoc = await Module.findById(moduleId);
    if (!moduleDoc) {
      return res.status(404).json({
        success: false,
        message: 'Module not found.',
        errorCode: 'MODULE_NOT_FOUND',
      });
    }

    const course = await Course.findById(moduleDoc.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Parent course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    const isOwner = course.instructor && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to manage this module.',
        errorCode: 'FORBIDDEN_MODULE_ACCESS',
      });
    }

    req.module = moduleDoc;
    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce ownership of a lesson via its parent course
 */
const requireLessonOwner = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Lesson ID parameter is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const lessonDoc = await Lesson.findById(lessonId);
    if (!lessonDoc) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }

    const course = await Course.findById(lessonDoc.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Parent course not found.',
        errorCode: 'COURSE_NOT_FOUND',
      });
    }

    const isOwner = course.instructor && course.instructor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to manage this lesson.',
        errorCode: 'FORBIDDEN_LESSON_ACCESS',
      });
    }

    req.lesson = lessonDoc;
    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce ownership of an assessment
 */
const requireAssessmentOwner = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID parameter is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    let assessment = null;
    if (mongoose.Types.ObjectId.isValid(assessmentId)) {
      assessment = await Assessment.findById(assessmentId);
    } else {
      assessment = await Assessment.findOne({ slug: assessmentId });
    }

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found.',
        errorCode: 'ASSESSMENT_NOT_FOUND',
      });
    }

    // Check ownership: createdBy, or instructor of courseId
    let isOwner = assessment.createdBy && assessment.createdBy.toString() === req.user._id.toString();
    if (!isOwner && assessment.courseId) {
      const course = await Course.findById(assessment.courseId);
      if (course && course.instructor && course.instructor.toString() === req.user._id.toString()) {
        isOwner = true;
      }
    }
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to manage this assessment.',
        errorCode: 'FORBIDDEN_ASSESSMENT_ACCESS',
      });
    }

    req.assessment = assessment;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to enforce ownership of a coding problem
 */
const requireProblemOwner = async (req, res, next) => {
  try {
    const { problemId } = req.params;
    if (!problemId) {
      return res.status(400).json({
        success: false,
        message: 'Problem ID parameter is required.',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    let problem = null;
    if (mongoose.Types.ObjectId.isValid(problemId)) {
      problem = await Problem.findById(problemId);
    } else {
      problem = await Problem.findOne({ slug: problemId });
    }

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Coding problem not found.',
        errorCode: 'PROBLEM_NOT_FOUND',
      });
    }

    const isOwner = problem.createdBy && problem.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to manage this coding problem.',
        errorCode: 'FORBIDDEN_PROBLEM_ACCESS',
      });
    }

    req.problem = problem;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireCourseOwner,
  requireModuleOwner,
  requireLessonOwner,
  requireAssessmentOwner,
  requireProblemOwner,
};
