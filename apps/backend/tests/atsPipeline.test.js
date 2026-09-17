const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const Job = require('../src/models/job.model');
const Company = require('../src/models/company.model');
const { JobApplication } = require('../src/models/application.model');
const AuditLog = require('../src/models/auditLog.model');
const { generateAccessToken } = require('../src/services/token.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 14 ATS Pipeline & Employer Intelligence Test Suite', () => {
  let employerUser;
  let employerToken;
  let studentUser;
  let company;
  let testJob;
  let testApplication;

  beforeEach(async () => {
    employerUser = await User.create({
      name: 'Test Employer Partner',
      email: `emp_${Date.now()}@company.com`,
      password: 'StrongPassword123!',
      role: 'ADMIN', // has employer management role
      status: 'ACTIVE',
    });
    employerToken = generateAccessToken(employerUser);

    studentUser = await User.create({
      name: 'Applicant Candidate',
      email: `candidate_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    company = await Company.create({
      name: 'Stripe Global',
      slug: `stripe-${Date.now()}`,
      website: 'https://stripe.example.com',
      employerUserIds: [employerUser._id],
    });

    testJob = await Job.create({
      title: 'Senior Systems Architect',
      companyId: company._id,
      description: 'Design distributed financial processing engines',
      skills: ['Node.js', 'Distributed Systems'],
      status: 'PUBLISHED',
    });

    testApplication = await JobApplication.create({
      studentId: studentUser._id,
      jobId: testJob._id,
      status: 'APPLIED',
      appliedAt: new Date(),
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Job.deleteMany({});
    await Company.deleteMany({});
    await JobApplication.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('1. ATS Kanban Pipeline Board', () => {
    it('GET /api/v1/employer/pipeline should return Kanban stages and candidate items', async () => {
      const res = await request(app)
        .get('/api/v1/employer/pipeline')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stages).toContain('APPLIED');
      expect(res.body.stages).toContain('SHORTLISTED');
      expect(res.body.board.APPLIED.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Candidate Pipeline Stage Transition & Audit', () => {
    it('PATCH /api/v1/employer/pipeline/:id/stage should advance stage and write audit trail', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/pipeline/${testApplication._id}/stage`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          stage: 'SHORTLISTED',
          note: 'Impressive distributed systems portfolio projects',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.application.status).toBe('SHORTLISTED');

      // Verify audit trail entry was created
      const auditEntry = await AuditLog.findOne({
        action: 'ATS_STAGE_UPDATE',
        resourceId: testApplication._id,
      });

      expect(auditEntry).toBeDefined();
      expect(auditEntry.metadata.newStage).toBe('SHORTLISTED');
      expect(auditEntry.metadata.previousStage).toBe('APPLIED');
    });

    it('should reject invalid pipeline stage', async () => {
      const res = await request(app)
        .patch(`/api/v1/employer/pipeline/${testApplication._id}/stage`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          stage: 'INVALID_STAGE_NAME',
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });
});
