const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Category = require('../src/models/category.model');
const { Report } = require('../src/models/report.model');
const AuditLog = require('../src/models/auditLog.model');
const tokenService = require('../src/services/token.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

jest.setTimeout(30000);

describe('Phase 9 — Admin Platform & Operations Integration Tests', () => {
  let superAdminToken;
  let adminToken;
  let restrictedAdminToken;
  let studentToken;
  let instructorToken;
  let superAdminUser;
  let adminUser;
  let restrictedAdminUser;
  let studentUser;
  let pendingInstructorUser;
  let pendingCourse;

  beforeAll(async () => {
    // 1. Create Super Admin
    superAdminUser = await User.create({
      name: 'Super Admin Test',
      email: 'superadmin.test@example.com',
      password: 'SuperAdminPass123!',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 2. Create Full Admin
    adminUser = await User.create({
      name: 'Full Admin Test',
      email: 'admin.test@example.com',
      password: 'AdminPass123!',
      role: 'ADMIN',
      permissions: [
        'users.read',
        'users.suspend',
        'instructors.approve',
        'courses.read',
        'courses.review',
        'courses.approve',
        'courses.publish',
        'assessments.manage',
        'problems.manage',
        'categories.manage',
        'reports.manage',
        'analytics.read',
        'audit.read',
        'settings.manage',
      ],
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 3. Create Restricted Admin (Only has users.read)
    restrictedAdminUser = await User.create({
      name: 'Restricted Admin Test',
      email: 'restricted.admin@example.com',
      password: 'AdminPass123!',
      role: 'ADMIN',
      permissions: ['users.read'],
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 4. Create Student
    studentUser = await User.create({
      name: 'Student Test',
      email: 'student.test@example.com',
      password: 'StudentPass123!',
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
    });

    // 5. Create Pending Instructor
    pendingInstructorUser = await User.create({
      name: 'Pending Instructor Test',
      email: 'pending.inst.test@example.com',
      password: 'InstructorPass123!',
      role: 'INSTRUCTOR',
      status: 'PENDING',
      isEmailVerified: true,
    });

    // 6. Create Course awaiting review
    pendingCourse = await Course.create({
      title: 'Pending Review Course',
      slug: 'pending-review-course-test',
      shortDescription: 'Testing admin approval workflow',
      description: 'Course details under review',
      category: 'Backend',
      difficulty: 'BEGINNER',
      instructor: pendingInstructorUser._id,
      status: 'PENDING_REVIEW',
    });

    // Generate tokens directly
    superAdminToken = tokenService.generateAccessToken(superAdminUser);
    adminToken = tokenService.generateAccessToken(adminUser);
    restrictedAdminToken = tokenService.generateAccessToken(restrictedAdminUser);
    studentToken = tokenService.generateAccessToken(studentUser);
  });

  afterAll(async () => {
    await User.deleteMany({
      email: {
        $in: [
          'superadmin.test@example.com',
          'admin.test@example.com',
          'restricted.admin@example.com',
          'student.test@example.com',
          'pending.inst.test@example.com',
        ],
      },
    });
    await Course.deleteMany({ slug: 'pending-review-course-test' });
    await Category.deleteMany({ slug: 'test-category' });
    await Report.deleteMany({ description: /test report/i });
  });

  // ==========================================
  // 1. RBAC & PERMISSION SECURITY
  // ==========================================
  describe('RBAC & Permission Enforcement', () => {
    it('blocks unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('blocks student token with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows Admin to access permitted routes (users.read)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${restrictedAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('blocks Admin lacking specific permission with 403 PERMISSION_DENIED', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${restrictedAdminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Attempt without permission' });
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('PERMISSION_DENIED');
    });

    it('blocks standard Admin from Super Admin endpoints (/admins)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/admins')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('SUPER_ADMIN_REQUIRED');
    });

    it('allows Super Admin full access to /admins', async () => {
      const res = await request(app)
        .get('/api/v1/admin/admins')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ==========================================
  // 2. SYSTEM HEALTH & OVERVIEW
  // ==========================================
  describe('System Health & Overview API', () => {
    it('returns safe operational health status without leaking secrets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/system/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();
      expect(res.body.data.components.database.status).toBe('OPERATIONAL');
      expect(res.body.data.components.backend.status).toBe('OPERATIONAL');
      // Verify no secrets leaked
      expect(JSON.stringify(res.body)).not.toContain('mongodb://');
      expect(JSON.stringify(res.body)).not.toContain('JWT_SECRET');
    });

    it('returns global platform overview KPIs', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis).toBeDefined();
      expect(typeof res.body.data.kpis.totalStudents).toBe('number');
      expect(typeof res.body.data.kpis.totalCourses).toBe('number');
    });
  });

  // ==========================================
  // 3. USER MANAGEMENT & SUSPENSION
  // ==========================================
  describe('User Management Workflow', () => {
    it('lists users with pagination and search', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?search=Student')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('suspends a user with mandatory reason and creates audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Violation of Terms of Service' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect(res.body.data.suspensionReason).toBe('Violation of Terms of Service');

      // Verify audit log
      const audit = await AuditLog.findOne({
        action: 'USER_SUSPENDED',
        resourceId: studentUser._id,
      });
      expect(audit).not.toBeNull();
      expect(audit.actorRole).toBe('ADMIN');
    });

    it('reactivates the suspended user', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.suspensionReason).toBeNull();
    });

    it('prevents normal admin from suspending a Super Admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${superAdminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Unauthorized privilege escalation' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================
  // 4. INSTRUCTOR APPROVAL WORKFLOW
  // ==========================================
  describe('Instructor Approval Workflow', () => {
    it('approves a pending instructor application', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/instructors/${pendingInstructorUser._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACTIVE');

      const audit = await AuditLog.findOne({
        action: 'INSTRUCTOR_APPROVED',
        resourceId: pendingInstructorUser._id,
      });
      expect(audit).not.toBeNull();
    });
  });

  // ==========================================
  // 5. COURSE REVIEW & APPROVAL WORKFLOW
  // ==========================================
  describe('Course Review & Publishing Lifecycle', () => {
    it('retrieves pending courses queue', async () => {
      const res = await request(app)
        .get('/api/v1/admin/courses/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.courses.some((c) => c._id === pendingCourse._id.toString())).toBe(true);
    });

    it('fetches comprehensive course review detail', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/courses/${pendingCourse._id}/review`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.course._id).toBe(pendingCourse._id.toString());
      expect(res.body.data.stats).toBeDefined();
    });

    it('approves the course', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/courses/${pendingCourse._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');
    });

    it('publishes the course to public catalog', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/courses/${pendingCourse._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.isPublished).toBe(true);
    });

    it('unpublishes the course', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/courses/${pendingCourse._id}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Curriculum update required' });

      expect(res.status).toBe(200);
      expect(res.body.data.isPublished).toBe(false);
    });
  });

  // ==========================================
  // 6. CATEGORIES & TAXONOMY
  // ==========================================
  describe('Categories Management', () => {
    let createdCategoryId;

    it('creates a new course category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          slug: 'test-category',
          description: 'Testing category creation',
          skills: ['TestSkill'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.slug).toBe('test-category');
      createdCategoryId = res.body.data._id;
    });

    it('archives the unused test category', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ARCHIVED');
    });
  });

  // ==========================================
  // 7. REPORTS & CONTENT MODERATION
  // ==========================================
  describe('Reports Queue & Moderation', () => {
    let reportId;

    beforeAll(async () => {
      const report = await Report.create({
        reporterId: studentUser._id,
        targetType: 'COURSE',
        targetId: pendingCourse._id,
        reason: 'SPAM',
        description: 'Test report for moderation queue',
        status: 'OPEN',
      });
      reportId = report._id;
    });

    it('lists reports with status filter', async () => {
      const res = await request(app)
        .get('/api/v1/admin/reports?status=OPEN')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reports.some((r) => r._id === reportId.toString())).toBe(true);
    });

    it('resolves a report with action taken note', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'RESOLVED',
          actionTaken: 'Content verified and confirmed safe',
          resolutionNotes: 'Reviewed by admin team',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('RESOLVED');
    });
  });

  // ==========================================
  // 8. AUDIT LOGS & EXPORT
  // ==========================================
  describe('Audit Logging System', () => {
    it('retrieves audit logs with pagination', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });

    it('exports audit logs as JSON and logs export action', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs/export?format=json')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const exportAudit = await AuditLog.findOne({ action: 'AUDIT_LOGS_EXPORTED' });
      expect(exportAudit).not.toBeNull();
    });
  });
});
