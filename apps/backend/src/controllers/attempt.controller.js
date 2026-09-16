const attemptService = require('../services/attempt.service');

/**
 * POST /api/v1/assessments/:assessmentId/attempts
 * Start or resume an assessment attempt
 */
async function startAttempt(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user._id;

    const result = await attemptService.startAttempt(assessmentId, studentId);

    const message = result.isResumed
      ? 'Resumed existing assessment attempt'
      : 'Assessment attempt started successfully';

    return res.status(result.isResumed ? 200 : 201).json({
      success: true,
      message,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assessments/attempts/:attemptId
 * Retrieve an in-progress attempt with safe questions
 */
async function getAttempt(req, res, next) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const result = await attemptService.getAttempt(attemptId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Attempt retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/assessments/attempts/:attemptId/answers
 * Auto-save / update answers during an in-progress attempt
 */
async function saveAnswer(req, res, next) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;
    const { questionId, selectedAnswers } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: 'questionId is required',
        errorCode: 'VALIDATION_ERROR',
      });
    }

    const result = await attemptService.saveAnswer(attemptId, studentId, {
      questionId,
      selectedAnswers: selectedAnswers || [],
    });

    return res.status(200).json({
      success: true,
      message: 'Answer saved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/assessments/attempts/:attemptId/submit
 * Submit an assessment and evaluate scores server-side
 */
async function submitAttempt(req, res, next) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const result = await attemptService.submitAttempt(attemptId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Assessment submitted successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assessments/attempts/:attemptId/result
 * Get assessment attempt result summary
 */
async function getAttemptResult(req, res, next) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const result = await attemptService.getAttemptResult(attemptId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Assessment result retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assessments/attempts/:attemptId/review
 * Review questions, answers, and explanations
 */
async function getAttemptReview(req, res, next) {
  try {
    const { attemptId } = req.params;
    const studentId = req.user._id;

    const result = await attemptService.getAttemptReview(attemptId, studentId);
    return res.status(200).json({
      success: true,
      message: 'Assessment review retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assessments/history
 * Get student's completed assessment history
 */
async function getStudentHistory(req, res, next) {
  try {
    const studentId = req.user._id;
    const { page, limit } = req.query;

    const history = await attemptService.getStudentHistory(studentId, {
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: 'Assessment history retrieved successfully',
      data: history,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getAttemptReview,
  getStudentHistory,
};
