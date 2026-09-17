const mongoose = require('mongoose');
const Progress = require('../models/progress.model');
const { Lesson } = require('../models/lesson.model');
const { Course } = require('../models/course.model');
const { Enrollment } = require('../models/enrollment.model');

/**
 * Start or initialize progress on a lesson
 */
const startLesson = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson || !lesson.isPublished) {
    throw new Error('LESSON_NOT_FOUND');
  }

  // Access validation: must be enrolled or lesson is preview
  const enrollment = await Enrollment.findOne({ studentId, courseId: lesson.courseId });
  if (!enrollment && !lesson.isPreview) {
    throw new Error('ENROLLMENT_REQUIRED');
  }

  let progress = await Progress.findOne({ studentId, courseId: lesson.courseId, lessonId });
  if (!progress) {
    progress = await Progress.create({
      studentId,
      courseId: lesson.courseId,
      lessonId,
      startedAt: new Date(),
    });
  }

  if (enrollment) {
    enrollment.lastLessonId = lessonId;
    await enrollment.save();
  }

  return progress;
};

/**
 * Update lesson position (debounced/throttled from video player)
 */
const updateLessonProgress = async (studentId, lessonId, { lastPosition = 0, timeSpent = 0 }) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND');
  }

  const enrollment = await Enrollment.findOne({ studentId, courseId: lesson.courseId });
  if (!enrollment && !lesson.isPreview) {
    throw new Error('ENROLLMENT_REQUIRED');
  }

  const progress = await Progress.findOneAndUpdate(
    { studentId, courseId: lesson.courseId, lessonId },
    {
      $set: { lastPosition: Math.max(0, Math.floor(lastPosition)) },
      $inc: { timeSpent: Math.max(0, Math.floor(timeSpent)) },
    },
    { new: true, upsert: true }
  );

  return progress;
};

/**
 * Mark a lesson as complete and recalculate course progress percentage
 */
const completeLesson = async (studentId, lessonId) => {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    throw new Error('LESSON_NOT_FOUND');
  }

  // Completing a lesson strictly requires enrollment
  const enrollment = await Enrollment.findOne({ studentId, courseId: lesson.courseId });
  if (!enrollment) {
    throw new Error('ENROLLMENT_REQUIRED');
  }

  // Mark lesson completed
  const progress = await Progress.findOneAndUpdate(
    { studentId, courseId: lesson.courseId, lessonId },
    {
      isCompleted: true,
      completedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  // Recalculate course completion metrics
  const totalLessons = await Lesson.countDocuments({ courseId: lesson.courseId, isPublished: true });
  const completedLessons = await Progress.countDocuments({
    studentId,
    courseId: lesson.courseId,
    isCompleted: true,
  });

  const progressPercentage = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  const isCourseCompleted = completedLessons >= totalLessons;

  enrollment.progressPercentage = progressPercentage;
  enrollment.lastLessonId = lessonId;

  if (isCourseCompleted && enrollment.status !== 'COMPLETED') {
    enrollment.status = 'COMPLETED';
    enrollment.completedAt = new Date();
  }

  await enrollment.save();

  // Phase 11: Learning Intelligence event hooks (graceful, non-blocking)
  try {
    const learningEventService = require('./intelligence/event.service');
    const achievementService = require('./intelligence/achievement.service');
    const goalService = require('./intelligence/goal.service');

    learningEventService.recordEvent({
      studentId,
      eventType: 'LESSON_COMPLETED',
      resourceType: 'Lesson',
      resourceId: lessonId,
      metadata: { courseId: lesson.courseId }
    }).catch(() => {});

    achievementService.checkAndAwardBadges(studentId, 'FIRST_LESSON').catch(() => {});
    if (isCourseCompleted) {
      achievementService.checkAndAwardBadges(studentId, 'COURSE_COMPLETED').catch(() => {});
    }
    goalService.incrementGoalProgress(studentId, 'COURSE_COMPLETION', 1).catch(() => {});
  } catch (err) {
    // Non-blocking fallback
  }

  return {
    progress,
    progressPercentage,
    completedLessons,
    totalLessons,
    isCourseCompleted,
  };
};

/**
 * Get student progress for a course
 */
const getCourseProgress = async (studentId, courseId) => {
  let targetCourseId = courseId;
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    const course = await Course.findOne({ slug: courseId }).select('_id');
    if (!course) {
      return {
        enrollment: null,
        progress: [],
        completedLessonIds: [],
      };
    }
    targetCourseId = course._id;
  }

  const [enrollment, progressRecords] = await Promise.all([
    Enrollment.findOne({ studentId, courseId: targetCourseId }).lean(),
    Progress.find({ studentId, courseId: targetCourseId }).lean(),
  ]);

  return {
    enrollment: enrollment || null,
    progress: progressRecords,
    completedLessonIds: progressRecords.filter((p) => p.isCompleted).map((p) => p.lessonId.toString()),
  };
};

module.exports = {
  startLesson,
  updateLessonProgress,
  completeLesson,
  getCourseProgress,
};
