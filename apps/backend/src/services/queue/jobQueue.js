/**
 * High-Reliability In-Memory / Redis-Ready Background Job Queue with DLQ
 * Phase 15 — Queue System & Dead Letter Queue (Sections 28 - 31)
 */

const crypto = require('crypto');
const uuidv4 = () => (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'));
const observability = require('../observability/observability.service');

const JOB_STATES = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  CANCELLED: 'CANCELLED',
};

class JobQueue {
  constructor(options = {}) {
    this.name = options.name || 'default';
    this.maxRetries = options.maxRetries || 3;
    this.initialBackoffMs = options.initialBackoffMs || 100;
    this.jobs = new Map(); // id -> job record
    this.dlq = new Map(); // id -> failed job record
    this.handlers = new Map(); // type -> async handler function
    this.processing = false;
  }

  registerHandler(jobType, handler) {
    this.handlers.set(jobType, handler);
  }

  enqueue(type, payload = {}, metadata = {}) {
    const id = `job_${uuidv4()}`;
    const job = {
      id,
      type,
      payload,
      metadata,
      state: JOB_STATES.QUEUED,
      attempts: 0,
      maxRetries: this.maxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
      error: null,
      result: null,
    };

    this.jobs.set(id, job);
    observability.setQueueDepth(this.getPendingJobs().length);

    // Trigger processing tick
    setImmediate(() => this.processNext());
    return job;
  }

  getPendingJobs() {
    return Array.from(this.jobs.values()).filter(
      (j) => j.state === JOB_STATES.QUEUED || j.state === JOB_STATES.RETRYING
    );
  }

  getJob(id) {
    return this.jobs.get(id) || this.dlq.get(id) || null;
  }

  getDLQ() {
    return Array.from(this.dlq.values());
  }

  async processNext() {
    if (this.processing) return;

    const pending = this.getPendingJobs();
    if (pending.length === 0) return;

    this.processing = true;
    observability.setActiveJobs(1);

    const job = pending[0];
    const handler = this.handlers.get(job.type);

    if (!handler) {
      job.state = JOB_STATES.FAILED;
      job.error = `No handler registered for type ${job.type}`;
      this.moveToDLQ(job);
      this.processing = false;
      return this.processNext();
    }

    job.state = JOB_STATES.PROCESSING;
    job.attempts += 1;
    job.updatedAt = new Date();

    try {
      const result = await handler(job.payload, job);
      job.state = JOB_STATES.COMPLETED;
      job.result = result;
      job.updatedAt = new Date();
    } catch (err) {
      job.error = err.message || String(err);
      job.updatedAt = new Date();

      if (job.attempts < job.maxRetries) {
        job.state = JOB_STATES.RETRYING;
        const delay = this.initialBackoffMs * Math.pow(2, job.attempts - 1);
        setTimeout(() => {
          this.processNext();
        }, delay).unref();
      } else {
        job.state = JOB_STATES.FAILED;
        observability.recordWorkerFailure();
        this.moveToDLQ(job);
      }
    } finally {
      this.processing = false;
      observability.setActiveJobs(0);
      observability.setQueueDepth(this.getPendingJobs().length);
      setImmediate(() => this.processNext());
    }
  }

  moveToDLQ(job) {
    this.jobs.delete(job.id);
    this.dlq.set(job.id, {
      ...job,
      movedToDlqAt: new Date(),
    });
  }

  retryDLQJob(id) {
    const job = this.dlq.get(id);
    if (!job) return null;

    this.dlq.delete(id);
    job.state = JOB_STATES.QUEUED;
    job.attempts = 0;
    job.error = null;
    job.updatedAt = new Date();
    this.jobs.set(id, job);

    setImmediate(() => this.processNext());
    return job;
  }

  cancelJob(id) {
    const job = this.jobs.get(id) || this.dlq.get(id);
    if (!job) return null;

    job.state = JOB_STATES.CANCELLED;
    job.updatedAt = new Date();
    this.jobs.set(id, job);
    this.dlq.delete(id);
    return job;
  }
}

const defaultQueue = new JobQueue({ name: 'platform-background-queue' });

module.exports = {
  JobQueue,
  JOB_STATES,
  defaultQueue,
};
