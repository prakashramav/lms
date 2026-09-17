const mongoose = require('mongoose');
const { Enrollment } = require('../models/enrollment.model');
const { Course } = require('../models/course.model');
const Module = require('../models/module.model');
const { Lesson } = require('../models/lesson.model');

/**
 * Enroll student in course (Idempotent)
 */
const enrollInCourse = async (studentId, courseId) => {
  let course = null;
  if (mongoose.Types.ObjectId.isValid(courseId)) {
    course = await Course.findById(courseId);
  } else {
    course = await Course.findOne({ slug: courseId });
  }

  if (!course || !course.isPublished || course.status !== 'PUBLISHED') {
    throw new Error('COURSE_UNAVAILABLE');
  }

  const targetCourseId = course._id;

  // Check if already enrolled (Idempotency)
  let enrollment = await Enrollment.findOne({ studentId, courseId: targetCourseId });
  if (enrollment) {
    return { enrollment, isNew: false };
  }

  // Find initial lesson to set lastLessonId
  let firstLessonId = null;
  const firstModule = await Module.findOne({ courseId: targetCourseId, isPublished: true }).sort({ order: 1 });
  if (firstModule) {
    const firstLesson = await Lesson.findOne({ moduleId: firstModule._id, isPublished: true }).sort({ order: 1 });
    if (firstLesson) {
      firstLessonId = firstLesson._id;
    }
  }

  enrollment = await Enrollment.create({
    studentId,
    courseId: targetCourseId,
    status: 'ACTIVE',
    progressPercentage: 0,
    lastLessonId: firstLessonId,
  });

  return { enrollment, isNew: true };
};

/**
 * Get all active enrollments for student
 */
const getStudentEnrollments = async (studentId) => {
  return Enrollment.find({ studentId, status: { $in: ['ACTIVE', 'COMPLETED'] } })
    .populate('courseId', 'title slug shortDescription thumbnail category difficulty duration')
    .sort({ updatedAt: -1 })
    .lean();
};

/**
 * Get single enrollment by course ID or slug
 */
const getEnrollmentByCourse = async (studentId, courseId) => {
  let targetCourseId = courseId;
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const course = await Course.findOne({ slug: courseId }).select('_id');
    if (!course) return null;
    targetCourseId = course._id;
  }
  return Enrollment.findOne({ studentId, courseId: targetCourseId }).lean();
};

module.exports = {
  enrollInCourse,
  getStudentEnrollments,
  getEnrollmentByCourse,
};
