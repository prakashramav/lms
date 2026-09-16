const crypto = require('crypto');
const { executionWorker } = require('./worker');

/**
 * In-Memory Execution Queue
 * Provides reliable queueing, job tracking, and concurrency control.
 */
class ExecutionQueue {
  constructor(concurrency = 4) {
    this.concurrency = concurrency;
    this.runningCount = 0;
    this.queue = [];
    this.jobs = new Map();
  }

  /**
   * Enqueue a new execution job
   */
  async addJob(jobData) {
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      data: jobData,
      status: 'QUEUED',
      queuedAt: new Date(),
      startedAt: null,
      completedAt: null,
      result: null,
      error: null,
    };

    this.jobs.set(jobId, job);
    this.queue.push(job);

    // Trigger process loop
    this._processNext();

    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  cancelJob(jobId, studentId) {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    if (job.data.studentId && job.data.studentId.toString() !== studentId.toString()) {
      throw new Error('Unauthorized to cancel this execution');
    }

    if (job.status === 'QUEUED') {
      job.status = 'CANCELLED';
      this.queue = this.queue.filter((j) => j.id !== jobId);
      return true;
    }

    return false;
  }

  async _processNext() {
    if (this.runningCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job || job.status === 'CANCELLED') {
      return this._processNext();
    }

    this.runningCount++;
    job.status = 'RUNNING';
    job.startedAt = new Date();

    try {
      const result = await executionWorker.execute(job.data);
      job.result = result;
      job.status = 'COMPLETED';
    } catch (err) {
      job.status = 'FAILED';
      job.error = err.message || 'Execution failed';
    } finally {
      job.completedAt = new Date();
      this.runningCount--;
      this._processNext();
    }
  }

  /**
   * Helper to wait for job completion or timeout (convenience for sync endpoints)
   */
  waitForJob(jobId, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        const job = this.getJob(jobId);
        if (!job) {
          return reject(new Error('Job not found'));
        }
        if (job.status === 'COMPLETED') {
          return resolve(job.result);
        }
        if (job.status === 'FAILED') {
          return reject(new Error(job.error || 'Execution job failed'));
        }
        if (job.status === 'CANCELLED') {
          return reject(new Error('Execution cancelled'));
        }
        if (Date.now() - startTime > timeoutMs) {
          job.status = 'TIMEOUT';
          return reject(new Error('Execution request timed out in queue'));
        }
        setTimeout(check, 100);
      };
      check();
    });
  }
}

const executionQueue = new ExecutionQueue();

module.exports = {
  ExecutionQueue,
  executionQueue,
};
