const assessmentService = require('../services/assessment.service');

/**
 * GET /api/v1/assessments
 * List assessments with search, filtering, and pagination
 */
async function getAssessments(req, res, next) {
  try {
    const { courseId, moduleId, difficulty, type, search, page, limit } = req.query;
    const studentId = req.user ? req.user._id : null;
    const isStudent = !req.user || req.user.role === 'STUDENT';

    const result = await assessmentService.getAssessments({
      courseId,
      moduleId,
      difficulty,
      type,
      search,
      studentId,
      page,
      limit,
      isStudent,
    });

    return res.status(200).json({
      success: true,
      message: 'Assessments retrieved successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/assessments/:assessmentId
 * Get assessment details and previous attempts
 */
async function getAssessmentById(req, res, next) {
  try {
    const { assessmentId } = req.params;
    const studentId = req.user ? req.user._id : null;
    const isStudent = !req.user || req.user.role === 'STUDENT';

    const assessment = await assessmentService.getAssessmentById(
      assessmentId,
      studentId,
      isStudent
    );

    return res.status(200).json({
      success: true,
      message: 'Assessment details retrieved successfully',
      data: assessment,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssessments,
  getAssessmentById,
};
