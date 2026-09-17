const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { JobQueue, JOB_STATES } = require('../src/services/queue/jobQueue');
const { generateAccessToken } = require('../src/services/token.service');
const { runBackup } = require('../scripts/backup');
const { runRestore } = require('../scripts/restore');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 15 Reliability, Job Queue & Idempotency Test Suite', () => {
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Reliability Admin',
      email: `rel_admin_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    adminToken = generateAccessToken(adminUser);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('1. Background Job Queue & Dead Letter Queue (DLQ)', () => {
    it('should process a background job successfully through state transitions', async () => {
      const queue = new JobQueue({ name: 'test-queue', maxRetries: 2, initialBackoffMs: 10 });
      let processedPayload = null;

      queue.registerHandler('TEST_REPORT_GEN', async (payload) => {
        processedPayload = payload;
        return { reportUrl: 'https://example.com/reports/123.pdf' };
      });

      const job = queue.enqueue('TEST_REPORT_GEN', { studentId: 'student_123', metric: 'weekly' });
      expect(job.state).toBe(JOB_STATES.QUEUED);

      // Wait for immediate queue processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      const finishedJob = queue.getJob(job.id);
      expect(finishedJob.state).toBe(JOB_STATES.COMPLETED);
      expect(finishedJob.result.reportUrl).toBe('https://example.com/reports/123.pdf');
      expect(processedPayload.studentId).toBe('student_123');
    });

    it('should retry on failure and move to DLQ when max retries are exceeded', async () => {
      const queue = new JobQueue({ name: 'failing-queue', maxRetries: 2, initialBackoffMs: 10 });

      queue.registerHandler('FAILING_TASK', async () => {
        throw new Error('External API Down');
      });

      const job = queue.enqueue('FAILING_TASK', { data: 1 });

      // Wait for 2 retries + backoffs
      await new Promise((resolve) => setTimeout(resolve, 150));

      const dlqList = queue.getDLQ();
      expect(dlqList.length).toBe(1);
      expect(dlqList[0].id).toBe(job.id);
      expect(dlqList[0].state).toBe(JOB_STATES.FAILED);
      expect(dlqList[0].attempts).toBe(2);

      // Test DLQ retry
      const retried = queue.retryDLQJob(job.id);
      expect(retried.state).toBe(JOB_STATES.QUEUED);
      expect(queue.getDLQ().length).toBe(0);
    });

    it('GET /api/v1/queue/status should allow admin to monitor background jobs', async () => {
      const res = await request(app)
        .get('/api/v1/queue/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.queueName).toBeDefined();
      expect(res.body.data.pendingCount).toBeDefined();
    });
  });

  describe('2. Idempotency Key Middleware', () => {
    it('should prevent duplicate processing and return cached response on identical key', async () => {
      const idempotencyKey = `idemp_${Date.now()}`;
      const payload = {
        targetType: 'PLATFORM',
        targetId: new mongoose.Types.ObjectId(),
        rating: 5,
        feedbackText: 'Excellent platform stability',
      };

      // First request: processes and caches
      const res1 = await request(app)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.statusCode).toBe(201);

      // Second request with same idempotency key: should hit cache
      const res2 = await request(app)
        .post('/api/v1/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.statusCode).toBe(201);
      expect(res2.headers['x-cache-idempotent']).toBe('HIT');
    });
  });

  describe('3. Observability & Health Probes', () => {
    it('GET /metrics should expose structured latency and error metrics', async () => {
      const observability = require('../src/services/observability/observability.service');
      observability.recordRequest(35, false);

      const res = await request(app).get('/metrics');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.metrics.uptimeSec).toBeGreaterThanOrEqual(0);
      expect(res.body.metrics.requests.total).toBeGreaterThanOrEqual(1);
      expect(res.body.metrics.cache.hitRatePercent).toBeDefined();
    });
  });

  describe('4. Disaster Recovery & Snapshot Verification', () => {
    it('should execute backup and restore cycle successfully', async () => {
      // 1. Create a dummy test record
      const testUser = await User.create({
        name: 'Backup Target User',
        email: `backup_user_${Date.now()}@example.com`,
        password: 'StrongPassword123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      // 2. Run backup snapshot
      const backupResult = await runBackup();
      expect(backupResult.success).toBe(true);
      expect(fs.existsSync(backupResult.backupPath)).toBe(true);

      // 3. Delete user to simulate data loss
      await User.findByIdAndDelete(testUser._id);
      const lostUser = await User.findById(testUser._id);
      expect(lostUser).toBeNull();

      // 4. Run restore from backup
      const restoreResult = await runRestore(backupResult.backupPath);
      expect(restoreResult.success).toBe(true);
      expect(restoreResult.totalRestored).toBeGreaterThanOrEqual(1);

      // 5. Verify user is restored
      const recoveredUser = await User.findById(testUser._id);
      expect(recoveredUser).toBeDefined();
      expect(recoveredUser.email).toBe(testUser.email);
    });
  });
});
