const cohortService = require('../services/admin/cohort.service');

/**
 * GET /api/v1/cohorts
 */
async function listCohorts(req, res, next) {
  try {
    const filter = {};
    if (req.query.track) filter.track = req.query.track;
    if (req.query.status) filter.status = req.query.status;

    const cohorts = await cohortService.getCohorts(filter);
    return res.status(200).json({
      success: true,
      data: cohorts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cohorts
 */
async function createCohort(req, res, next) {
  try {
    const { name, code, track, description, startDate, endDate } = req.body;
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'name and code are required',
      });
    }

    const cohort = await cohortService.createCohort(
      { name, code, track, description, startDate, endDate },
      req.user._id
    );

    return res.status(201).json({
      success: true,
      message: 'Cohort created successfully',
      data: cohort,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cohorts/:cohortId/enroll
 */
async function enrollStudents(req, res, next) {
  try {
    const { cohortId } = req.params;
    const { studentIds } = req.body;
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'studentIds array is required',
      });
    }

    const updated = await cohortService.enrollStudentsInCohort(cohortId, studentIds);
    return res.status(200).json({
      success: true,
      message: `${studentIds.length} students enrolled in cohort`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/cohorts/:cohortId/dashboard
 */
async function getCohortDashboard(req, res, next) {
  try {
    const { cohortId } = req.params;
    const dashboard = await cohortService.getCohortDashboard(cohortId);
    return res.status(200).json({
      success: true,
      data: dashboard,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/cohorts/compare
 */
async function compareCohorts(req, res, next) {
  try {
    const { cohortIds } = req.body;
    if (!Array.isArray(cohortIds) || cohortIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'cohortIds array with at least 2 IDs is required',
      });
    }

    const comparison = await cohortService.compareCohorts(cohortIds);
    return res.status(200).json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCohorts,
  createCohort,
  enrollStudents,
  getCohortDashboard,
  compareCohorts,
};
