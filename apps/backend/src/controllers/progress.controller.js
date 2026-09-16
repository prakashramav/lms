const progressService = require('../services/progress.service');

/**
 * Get progress for course
 * @route GET /api/v1/progress/:courseId
 */
const getProgress = async (req, res, next) => {
  try {
    const data = await progressService.getCourseProgress(req.user._id, req.params.courseId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start lesson
 * @route POST /api/v1/progress/lessons/:lessonId/start
 */
const start = async (req, res, next) => {
  try {
    const progress = await progressService.startLesson(req.user._id, req.params.lessonId);

    res.status(200).json({
      success: true,
      message: 'Lesson started.',
      data: { progress },
    });
  } catch (error) {
    if (error.message === 'ENROLLMENT_REQUIRED') {
      return res.status(403).json({
        success: false,
        message: 'Enrollment required to access this lesson.',
        errorCode: 'ENROLLMENT_REQUIRED',
      });
    }
    if (error.message === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }
    next(error);
  }
};

/**
 * Update lesson position
 * @route PATCH /api/v1/progress/lessons/:lessonId
 */
const updateProgress = async (req, res, next) => {
  try {
    const { lastPosition, timeSpent } = req.body;
    const progress = await progressService.updateLessonProgress(
      req.user._id,
      req.params.lessonId,
      { lastPosition, timeSpent }
    );

    res.status(200).json({
      success: true,
      data: { progress },
    });
  } catch (error) {
    if (error.message === 'ENROLLMENT_REQUIRED') {
      return res.status(403).json({
        success: false,
        message: 'Enrollment required to update progress.',
        errorCode: 'ENROLLMENT_REQUIRED',
      });
    }
    next(error);
  }
};

/**
 * Mark lesson completed
 * @route POST /api/v1/progress/lessons/:lessonId/complete
 */
const markComplete = async (req, res, next) => {
  try {
    const result = await progressService.completeLesson(req.user._id, req.params.lessonId);

    res.status(200).json({
      success: true,
      message: 'Lesson marked as complete.',
      data: result,
    });
  } catch (error) {
    if (error.message === 'ENROLLMENT_REQUIRED') {
      return res.status(403).json({
        success: false,
        message: 'Enrollment required to complete lesson.',
        errorCode: 'ENROLLMENT_REQUIRED',
      });
    }
    if (error.message === 'LESSON_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found.',
        errorCode: 'LESSON_NOT_FOUND',
      });
    }
    next(error);
  }
};

module.exports = {
  getProgress,
  start,
  updateProgress,
  markComplete,
};
