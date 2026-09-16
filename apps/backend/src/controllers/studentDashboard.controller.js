const studentDashboardService = require('../services/studentDashboard.service');

/**
 * Get personalized student dashboard telemetry
 * @route GET /api/v1/student/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const dashboardData = await studentDashboardService.getStudentDashboardData(req.user._id);

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
