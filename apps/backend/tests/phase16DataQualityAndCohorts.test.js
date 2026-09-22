const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const Cohort = require('../src/models/cohort.model');
const Progress = require('../src/models/progress.model');
const ProjectShowcase = require('../src/models/projectShowcase.model');
const { generateAccessToken } = require('../src/services/token.service');
const cohortService = require('../src/services/admin/cohort.service');
const projectService = require('../src/services/career/projectProgression.service');
const dataQualityService = require('../src/services/admin/dataQuality.service');

jest.setTimeout(30000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 16 - Institutional Cohorts, Projects & Data Quality', () => {
  let adminUser;
  let instructorUser;
  let student1;
  let student2;
  let adminToken;
  let instructorToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Cohort.deleteMany({});
    await Progress.deleteMany({});
    await ProjectShowcase.deleteMany({});

    adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@cohort.test',
      password: 'Password123!',
      role: 'ADMIN',
      isVerified: true,
    });

    instructorUser = await User.create({
      name: 'Lead Instructor',
      email: 'instructor@cohort.test',
      password: 'Password123!',
      role: 'INSTRUCTOR',
      isVerified: true,
    });

    student1 = await User.create({
      name: 'Cohort Member 1',
      email: 'member1@cohort.test',
      password: 'Password123!',
      role: 'STUDENT',
      isVerified: true,
    });

    student2 = await User.create({
      name: 'Cohort Member 2',
      email: 'member2@cohort.test',
      password: 'Password123!',
      role: 'STUDENT',
      isVerified: true,
    });

    adminToken = generateAccessToken(adminUser);
    instructorToken = generateAccessToken(instructorUser);
  });

  describe('1. Institutional Cohorts & Drop-off Detection', () => {
    it('should create cohort, enroll students, and calculate cohort metrics', async () => {
      const cohort = await cohortService.createCohort(
        {
          name: 'Batch 2026 - Frontend Track',
          code: 'BATCH-2026-FE',
          track: 'FRONTEND',
        },
        instructorUser._id
      );

      expect(cohort.code).toBe('BATCH-2026-FE');
      expect(cohort.status).toBe('ACTIVE');

      // Enroll students
      await cohortService.enrollStudentsInCohort(cohort._id, [student1._id, student2._id]);

      // Mock progress for student1 = 80%, student2 = 10%
      await Progress.create({
        studentId: student1._id,
        courseId: cohort._id, // placeholder ObjectId
        lessonId: new mongoose.Types.ObjectId(),
        overallPercentage: 80,
        isCompleted: false,
      });

      await Progress.create({
        studentId: student2._id,
        courseId: cohort._id,
        lessonId: new mongoose.Types.ObjectId(),
        overallPercentage: 10,
        isCompleted: false,
      });

      const dashboard = await cohortService.getCohortDashboard(cohort._id);
      expect(dashboard.totalStudents).toBe(2);
      expect(dashboard.metrics.averageProgress).toBe(45); // (80 + 10) / 2
      expect(dashboard.dropOffRisk.length).toBe(1);
      expect(dashboard.dropOffRisk[0].studentId.toString()).toBe(student2._id.toString());
      expect(dashboard.dropOffRisk[0].riskLevel).toBe('MEDIUM');
    });

    it('should compare cohorts across aggregate completion and progress', async () => {
      const c1 = await cohortService.createCohort(
        { name: 'Cohort Alpha', code: 'ALPHA-01', track: 'FULLSTACK' },
        instructorUser._id
      );
      const c2 = await cohortService.createCohort(
        { name: 'Cohort Beta', code: 'BETA-02', track: 'FULLSTACK' },
        instructorUser._id
      );

      const comparison = await cohortService.compareCohorts([c1._id, c2._id]);
      expect(comparison.comparedCount).toBe(2);
      expect(comparison.cohorts[0].code).toBe('ALPHA-01');
      expect(comparison.cohorts[1].code).toBe('BETA-02');
    });
  });

  describe('2. Project Progression & Verification', () => {
    it('should advance project stage and verify GitHub repository & demo link', async () => {
      const project = await ProjectShowcase.create({
        studentId: student1._id,
        title: 'Full Stack Realtime Dashboard',
        description: 'Collaborative analytics portal with Next.js and WebSockets',
        skills: ['React', 'Node.js', 'WebSockets'],
        githubUrl: 'https://github.com/test-org/analytics-portal',
        demoUrl: 'https://analytics-portal.example.com',
      });

      expect(project.stage).toBe('DEVELOPMENT');

      // Update progression to DEPLOYMENT with checklist
      const updated = await projectService.updateProjectProgression(student1._id, project._id, {
        stage: 'DEPLOYMENT',
        features: ['OAuth2 Login', 'WebSocket charts', 'Role management'],
        qualityChecklist: {
          architecture: true,
          codeQuality: true,
          deployment: true,
        },
      });

      expect(updated.stage).toBe('DEPLOYMENT');
      expect(updated.features.length).toBe(3);
      expect(updated.qualityChecklist.architecture).toBe(true);

      // Verify evidence
      const verified = await projectService.verifyProjectEvidence(student1._id, project._id);
      expect(verified.verification.githubVerified).toBe(true);
      expect(verified.verification.githubMetadata.repoName).toBe('test-org/analytics-portal');
      expect(verified.verification.liveStatus).toBe('ONLINE');
    });
  });

  describe('3. Data Quality Engine & Audited Repair', () => {
    it('should scan data quality, report discrepancies, and require confirmation token for repair', async () => {
      // Create an orphan progress pointing to a non-existent course
      await Progress.create({
        studentId: student1._id,
        courseId: '60c72b2f9b1d8b2bad000001', // random non-existent ID
        lessonId: new mongoose.Types.ObjectId(),
        overallPercentage: 50,
      });

      const scan = await dataQualityService.scanDataQuality();
      expect(scan.healthStatus).toBe('WARNING');
      const orphanIssue = scan.issues.find((i) => i.category === 'ORPHAN_PROGRESS');
      expect(orphanIssue).toBeDefined();
      expect(orphanIssue.affectedCount).toBeGreaterThanOrEqual(1);

      // Preview repair
      const preview = await dataQualityService.previewDataRepair('ORPHAN_PROGRESS');
      expect(preview.canRepair).toBe(true);
      expect(preview.requiresConfirmation).toBe(true);

      // Attempt repair without token -> should fail
      await expect(
        dataQualityService.executeDataRepair(adminUser, 'ORPHAN_PROGRESS', 'INVALID_TOKEN')
      ).rejects.toThrow('Explicit confirmation token');

      // Execute repair with valid token
      const repairResult = await dataQualityService.executeDataRepair(
        adminUser,
        'ORPHAN_PROGRESS',
        'CONFIRM_REPAIR'
      );

      expect(repairResult.success).toBe(true);
      expect(repairResult.repairedCount).toBeGreaterThanOrEqual(1);

      // Re-scan -> orphan progress issue should be cleared
      const cleanScan = await dataQualityService.scanDataQuality();
      const recheckedIssue = cleanScan.issues.find((i) => i.category === 'ORPHAN_PROGRESS');
      expect(recheckedIssue).toBeUndefined();
    });
  });
});
