const spacedReviewService = require('../services/intelligence/spacedReviewV2.service');

/**
 * GET /api/v1/spaced-review/due
 */
async function getDueItems(req, res, next) {
  try {
    const studentId = req.user._id;
    const due = await spacedReviewService.getDueReviews(studentId);
    return res.status(200).json({
      success: true,
      data: due,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/spaced-review/attempt
 */
async function recordReviewAttempt(req, res, next) {
  try {
    const studentId = req.user._id;
    const { reviewId, wasSuccessful, recallScore } = req.body;
    if (!reviewId || wasSuccessful === undefined) {
      return res.status(400).json({
        success: false,
        message: 'reviewId and wasSuccessful boolean are required',
      });
    }

    const updated = await spacedReviewService.recordReviewAttempt(studentId, reviewId, {
      wasSuccessful: Boolean(wasSuccessful),
      recallScore: Number(recallScore) || (wasSuccessful ? 85 : 40),
    });

    return res.status(200).json({
      success: true,
      message: 'Review attempt recorded and interval updated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/spaced-review/mistakes
 */
async function getMistakes(req, res, next) {
  try {
    const studentId = req.user._id;
    const { resolved, category } = req.query;
    const isResolved = resolved !== undefined ? resolved === 'true' : false;

    const mistakeData = await spacedReviewService.getMistakeBank(studentId, {
      resolved: isResolved,
      category,
    });

    return res.status(200).json({
      success: true,
      data: mistakeData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/spaced-review/mistakes
 */
async function logMistake(req, res, next) {
  try {
    const studentId = req.user._id;
    const {
      sourceType,
      sourceId,
      topic,
      skillSlug,
      promptSnippet,
      studentAnswer,
      correctAnswerReference,
      explanation,
      mistakeType,
      categoryEvidence,
    } = req.body;

    if (!sourceType || !sourceId || !topic) {
      return res.status(400).json({
        success: false,
        message: 'sourceType, sourceId, and topic are required',
      });
    }

    const mistake = await spacedReviewService.recordMistake({
      studentId,
      sourceType,
      sourceId,
      topic,
      skillSlug,
      promptSnippet,
      studentAnswer,
      correctAnswerReference,
      explanation,
      mistakeType: mistakeType || 'INCORRECT_CHOICE',
      categoryEvidence,
    });

    return res.status(201).json({
      success: true,
      message: 'Mistake logged to Mistake Bank',
      data: mistake,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/spaced-review/mistakes/:mistakeId/resolve
 */
async function resolveMistake(req, res, next) {
  try {
    const studentId = req.user._id;
    const { mistakeId } = req.params;
    const resolved = await spacedReviewService.resolveMistake(studentId, mistakeId);
    if (!resolved) {
      return res.status(404).json({
        success: false,
        message: 'Mistake not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mistake resolved',
      data: resolved,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDueItems,
  recordReviewAttempt,
  getMistakes,
  logMistake,
  resolveMistake,
};
