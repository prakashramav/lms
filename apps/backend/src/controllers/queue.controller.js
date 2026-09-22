const { defaultQueue } = require('../services/queue/jobQueue');
const observability = require('../services/observability/observability.service');

/**
 * Background Job Queue & DLQ Controller
 * Phase 15 — Reliability & Observability (Sections 28 - 31)
 */

const getQueueStatus = async (req, res, next) => {
  try {
    const pendingJobs = defaultQueue.getPendingJobs();
    const dlqJobs = defaultQueue.getDLQ();
    const snapshot = observability.getSnapshot();

    res.status(200).json({
      success: true,
      data: {
        queueName: defaultQueue.name,
        pendingCount: pendingJobs.length,
        dlqCount: dlqJobs.length,
        activeJobs: snapshot.queue.activeJobs,
        pendingJobs: pendingJobs.slice(0, 50),
        dlq: dlqJobs.slice(0, 50),
      },
      message: 'Queue status retrieved successfully',
    });
  } catch (err) {
    next(err);
  }
};

const retryDLQJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = defaultQueue.retryDLQJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND_IN_DLQ',
          message: `Job ${jobId} not found in Dead Letter Queue`,
          details: { jobId },
        },
        errorCode: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
      message: `Job ${jobId} re-enqueued for processing`,
    });
  } catch (err) {
    next(err);
  }
};

const cancelJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = defaultQueue.cancelJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job ${jobId} not found`,
          details: { jobId },
        },
        errorCode: 'NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
      message: `Job ${jobId} cancelled successfully`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQueueStatus,
  retryDLQJob,
  cancelJob,
};
