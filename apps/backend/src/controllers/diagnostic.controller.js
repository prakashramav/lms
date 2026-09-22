const diagnosticService = require('../services/intelligence/diagnosticAssessment.service');

/**
 * POST /api/v1/diagnostic/start
 */
async function startDiagnostic(req, res, next) {
  try {
    const studentId = req.user._id;
    const track = req.body.track || 'FULLSTACK';
    const session = await diagnosticService.startDiagnostic(studentId, track);
    return res.status(201).json({
      success: true,
      data: session,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/diagnostic/submit-answer
 */
async function submitAnswer(req, res, next) {
  try {
    const studentId = req.user._id;
    const { attemptId, questionId, selectedAnswer } = req.body;
    if (!attemptId || !questionId || selectedAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: 'attemptId, questionId, and selectedAnswer are required',
      });
    }

    const result = await diagnosticService.submitDiagnosticAnswer(
      studentId,
      attemptId,
      questionId,
      selectedAnswer
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/diagnostic/report/:attemptId
 */
async function getReport(req, res, next) {
  try {
    const studentId = req.user._id;
    const { attemptId } = req.params;
    const report = await diagnosticService.getDiagnosticReport(studentId, attemptId);
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  startDiagnostic,
  submitAnswer,
  getReport,
};
