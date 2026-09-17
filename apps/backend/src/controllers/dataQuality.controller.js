const dataQualityService = require('../services/admin/dataQuality.service');

/**
 * GET /api/v1/admin/data-quality/scan
 */
async function scanDataQuality(req, res, next) {
  try {
    const report = await dataQualityService.scanDataQuality();
    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/admin/data-quality/preview
 */
async function previewDataRepair(req, res, next) {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'category is required',
      });
    }

    const preview = await dataQualityService.previewDataRepair(category);
    return res.status(200).json({
      success: true,
      data: preview,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/admin/data-quality/repair
 */
async function executeDataRepair(req, res, next) {
  try {
    const { category, confirmationToken } = req.body;
    if (!category || !confirmationToken) {
      return res.status(400).json({
        success: false,
        message: 'category and confirmationToken are required',
      });
    }

    const result = await dataQualityService.executeDataRepair(
      req.user,
      category,
      confirmationToken
    );

    return res.status(200).json({
      success: true,
      message: result.actionSummary,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  scanDataQuality,
  previewDataRepair,
  executeDataRepair,
};
