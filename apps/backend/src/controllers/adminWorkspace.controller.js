const { Workspace } = require('../models/workspace.model');
const { templateRegistry } = require('../services/workspace/templateRegistry');
const { processManager } = require('../services/workspace/processManager');
const { storageManager } = require('../services/workspace/storageManager');
const { formatResponse } = require('@edtech/shared');

class AdminWorkspaceController {
  /**
   * List all workspaces across platform with filters
   */
  async listAllWorkspaces(req, res, next) {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const skip = (page - 1) * limit;

      const filter = {};
      if (req.query.status) {
        filter.status = req.query.status.toUpperCase();
      }
      if (req.query.templateId) {
        filter.templateId = req.query.templateId.toLowerCase();
      }
      if (req.query.userId) {
        filter.userId = req.query.userId;
      }

      const [workspaces, total] = await Promise.all([
        Workspace.find(filter)
          .populate('userId', 'name email role')
          .populate('courseId', 'title')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Workspace.countDocuments(filter),
      ]);

      return res.status(200).json(
        formatResponse(true, 'Workspaces retrieved', workspaces, {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Aggregate resource usage and telemetry metrics
   */
  async getSystemMetrics(req, res, next) {
    try {
      const [
        activeCount,
        failedCount,
        stoppedCount,
        totalWorkspaces,
      ] = await Promise.all([
        Workspace.countDocuments({ status: 'RUNNING' }),
        Workspace.countDocuments({ status: 'FAILED' }),
        Workspace.countDocuments({ status: 'STOPPED' }),
        Workspace.countDocuments({ status: { $ne: 'DELETED' } }),
      ]);

      // Metrics aggregation across documents
      const aggregateMetrics = await Workspace.aggregate([
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$metrics.durationMinutes' },
            totalGpuMinutes: { $sum: '$metrics.gpuMinutes' },
            totalTokens: { $sum: '$metrics.tokenUsage' },
            totalCost: { $sum: '$metrics.cost' },
          },
        },
      ]);

      const metricData = aggregateMetrics[0] || {
        totalDuration: 0,
        totalGpuMinutes: 0,
        totalTokens: 0,
        totalCost: 0,
      };

      return res.status(200).json(
        formatResponse(true, 'Workspace metrics retrieved', {
          activeWorkspaces: activeCount,
          failedWorkspaces: failedCount,
          stoppedWorkspaces: stoppedCount,
          totalWorkspaces,
          gpuMinutesTotal: metricData.totalGpuMinutes,
          aiTokenUsageTotal: metricData.totalTokens,
          estimatedCloudCostUSD: metricData.totalCost,
          storageEstimateMB: totalWorkspaces * 45, // Approximate 45MB/volume
          timestamp: new Date().toISOString(),
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Enable/disable a template globally
   */
  async toggleTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const { enabled } = req.body;

      const template = templateRegistry.getTemplate(templateId);
      if (!template) {
        return res.status(404).json(formatResponse(false, 'Template not found'));
      }

      template.disabled = enabled === false;

      return res.status(200).json(
        formatResponse(true, `Template "${templateId}" status updated`, {
          templateId,
          disabled: template.disabled,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Force terminate a rogue workspace
   */
  async forceTerminateWorkspace(req, res, next) {
    try {
      const { id } = req.params;
      const workspace = await Workspace.findById(id);
      if (!workspace) {
        return res.status(404).json(formatResponse(false, 'Workspace not found'));
      }

      processManager.terminateWorkspaceProcess(id);
      workspace.status = 'STOPPED';
      workspace.failureReason = 'Terminated by administrator governance.';
      await workspace.save();

      return res.status(200).json(formatResponse(true, 'Workspace forcefully terminated', workspace));
    } catch (err) {
      next(err);
    }
  }
}

const adminWorkspaceController = new AdminWorkspaceController();

module.exports = {
  adminWorkspaceController,
  AdminWorkspaceController,
};
