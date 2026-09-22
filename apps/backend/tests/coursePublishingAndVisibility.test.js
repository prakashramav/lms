const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
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

describe('Course Publishing & Student Visibility Suite', () => {
  let instructorUser;
  let otherInstructorUser;
  let adminUser;
  let studentUser;
  let instructorToken;
  let otherInstructorToken;
  let adminToken;
  let studentToken;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
    ]);

    // Create test accounts
    instructorUser = await User.create({
      name: 'Professor Ada Lovelace',
      email: 'ada@university.edu',
      password: 'SecurePassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    otherInstructorUser = await User.create({
      name: 'Dr. Alan Turing',
      email: 'alan@university.edu',
      password: 'SecurePassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    adminUser = await User.create({
      name: 'System Dean Admin',
      email: 'dean@platform.edu',
      password: 'SecurePassword123!',
      role: 'ADMIN',
      status: 'ACTIVE',
      permissions: ['courses.read', 'courses.review', 'courses.publish', 'courses.approve'],
    });

    studentUser = await User.create({
      name: 'Student Grace Hopper',
      email: 'grace@student.edu',
      password: 'SecurePassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    instructorToken = tokenService.generateAuthToken(instructorUser);
    otherInstructorToken = tokenService.generateAuthToken(otherInstructorUser);
    adminToken = tokenService.generateAuthToken(adminUser);
    studentToken = tokenService.generateAuthToken(studentUser);
  });

  // Helper to create valid course with module and lesson
  const createValidCourse = async (authorUser, overrides = {}) => {
    const title = overrides.title || 'Introduction to Distributed Systems';
    const slug = overrides.slug || 'intro-distributed-systems-' + Math.random().toString(36).substring(2, 7);
    const course = await Course.create({
      title,
      slug,
      shortDescription: 'Comprehensive hands-on study of distributed systems, consensus, and fault tolerance.',
      description: 'Full course covering replication, consensus protocols (Raft/Paxos), fault tolerance, and event-driven architectures.',
      category: overrides.category || 'Backend',
      difficulty: overrides.difficulty || 'INTERMEDIATE',
      instructor: authorUser._id,
      status: overrides.status || 'DRAFT',
      isPublished: overrides.isPublished !== undefined ? overrides.isPublished : false,
      publishedAt: overrides.publishedAt || null,
      publishedBy: overrides.publishedBy || null,
      publishedByRole: overrides.publishedByRole || null,
    });

    const moduleDoc = await Module.create({
      courseId: course._id,
      title: 'Module 1: Foundations of Fault Tolerance',
      order: 1,
      isPublished: true,
    });

    await Lesson.create({
      courseId: course._id,
      moduleId: moduleDoc._id,
      title: 'Lesson 1.1: Consistency and Replication',
      slug: 'lesson-1-1-consistency-and-replication',
      order: 1,
      isPublished: true,
      content: 'Detailed explanation of CAP theorem and state machine replication.',
    });

    return course;
  };

  describe('1. Course Publishing Lifecycle', () => {
    it('allows an instructor to publish their own course, recording publishedAt and publishedByRole: instructor', async () => {
      const course = await createValidCourse(instructorUser);

      const res = await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .set('X-Portal', 'instructor')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.course.status).toBe('published');
      expect(res.body.course.publishedByRole).toBe('instructor');
      expect(res.body.course.publishedAt).toBeDefined();

      const updated = await Course.findById(course._id);
      expect(updated.status).toBe('PUBLISHED');
      expect(updated.isPublished).toBe(true);
      expect(updated.publishedByRole).toBe('instructor');
      expect(updated.publishedBy.toString()).toBe(instructorUser._id.toString());
    });

    it('allows an admin to publish an instructor course, recording publishedByRole: admin', async () => {
      const course = await createValidCourse(instructorUser);

      const res = await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Portal', 'admin')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.course.status).toBe('published');
      expect(res.body.course.publishedByRole).toBe('admin');

      const updated = await Course.findById(course._id);
      expect(updated.status).toBe('PUBLISHED');
      expect(updated.isPublished).toBe(true);
      expect(updated.publishedByRole).toBe('admin');
      expect(updated.publishedBy.toString()).toBe(adminUser._id.toString());
    });

    it('denies students from publishing courses with 403 Forbidden', async () => {
      const course = await createValidCourse(instructorUser);

      const res = await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Portal', 'student')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('denies an instructor from publishing another instructor course with 403 Forbidden', async () => {
      const course = await createValidCourse(instructorUser);

      const res = await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${otherInstructorToken}`)
        .set('X-Portal', 'instructor')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('2. Student Course Catalog Discovery Rules', () => {
    it('displays courses published by both Instructor and Admin in the student catalog', async () => {
      // 1. Instructor-published course
      const instructorCourse = await createValidCourse(instructorUser, {
        title: 'Cloud Architecture Mastery',
        category: 'DevOps',
      });
      await request(app)
        .post(`/api/v1/courses/${instructorCourse._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      // 2. Admin-published course
      const adminCourse = await createValidCourse(otherInstructorUser, {
        title: 'Compiler Design and Optimization',
        category: 'Computer Science',
      });
      await request(app)
        .post(`/api/v1/courses/${adminCourse._id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      // 3. Draft course (should NOT appear)
      await createValidCourse(instructorUser, {
        title: 'Draft Secret Course',
        status: 'DRAFT',
        isPublished: false,
      });

      // 4. Archived course (should NOT appear)
      await createValidCourse(instructorUser, {
        title: 'Archived Deprecated Course',
        status: 'ARCHIVED',
        isPublished: false,
      });

      // Query Student Catalog
      const res = await request(app)
        .get('/api/v1/courses')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Portal', 'student')
        .expect(200);

      expect(res.body.success).toBe(true);
      const items = res.body.courses || res.body.data.items;
      expect(items.length).toBe(2);

      const titles = items.map((c) => c.title);
      expect(titles).toContain('Cloud Architecture Mastery');
      expect(titles).toContain('Compiler Design and Optimization');
      expect(titles).not.toContain('Draft Secret Course');
      expect(titles).not.toContain('Archived Deprecated Course');
    });

    it('enforces published-only visibility even if query param ?status=draft is sent', async () => {
      await createValidCourse(instructorUser, {
        title: 'Draft Course Manipulation Attempt',
        status: 'DRAFT',
        isPublished: false,
      });

      const res = await request(app)
        .get('/api/v1/courses?status=draft')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Portal', 'student')
        .expect(200);

      const items = res.body.courses || res.body.data.items;
      expect(items.length).toBe(0);
    });

    it('searches and filters strictly within published courses', async () => {
      // Published course
      const pubCourse = await createValidCourse(instructorUser, {
        title: 'Mastering Rust Concurrency',
        category: 'Systems',
      });
      await request(app)
        .post(`/api/v1/courses/${pubCourse._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      // Draft course matching same keyword
      await createValidCourse(instructorUser, {
        title: 'Rust for Beginners (Unreleased Draft)',
        category: 'Systems',
        status: 'DRAFT',
        isPublished: false,
      });

      const searchRes = await request(app)
        .get('/api/v1/courses?search=Rust')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('X-Portal', 'student')
        .expect(200);

      const items = searchRes.body.courses || searchRes.body.data.items;
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Mastering Rust Concurrency');
    });

    it('counts only published courses in catalog pagination', async () => {
      // Create 3 published and 5 draft courses
      for (let i = 1; i <= 3; i++) {
        const c = await createValidCourse(instructorUser, { title: `Published Course ${i}` });
        await request(app)
          .post(`/api/v1/courses/${c._id}/publish`)
          .set('Authorization', `Bearer ${instructorToken}`);
      }

      for (let j = 1; j <= 5; j++) {
        await createValidCourse(instructorUser, { title: `Draft Course ${j}`, status: 'DRAFT' });
      }

      const res = await request(app)
        .get('/api/v1/courses?limit=2&page=1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.pagination.total).toBe(3);
      expect(res.body.pagination.totalPages).toBe(2);
      expect(res.body.courses.length).toBe(2);
    });
  });

  describe('3. Course Detail Access Rules', () => {
    it('returns course details to students when course is published', async () => {
      const course = await createValidCourse(instructorUser, { slug: 'react-enterprise-patterns' });
      await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`);

      const res = await request(app)
        .get(`/api/v1/courses/${course.slug}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('react-enterprise-patterns');
    });

    it('returns 404 Course Not Found to students when course is draft or archived', async () => {
      const draftCourse = await createValidCourse(instructorUser, {
        slug: 'top-secret-draft-course',
        status: 'DRAFT',
        isPublished: false,
      });

      const res = await request(app)
        .get(`/api/v1/courses/${draftCourse.slug}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('COURSE_NOT_FOUND');
    });

    it('allows course owner instructor to preview their own unpublished course', async () => {
      const draftCourse = await createValidCourse(instructorUser, {
        slug: 'instructor-own-preview-draft',
        status: 'DRAFT',
        isPublished: false,
      });

      const res = await request(app)
        .get(`/api/v1/courses/${draftCourse.slug}`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('instructor-own-preview-draft');
    });

    it('allows admin to preview any unpublished course', async () => {
      const draftCourse = await createValidCourse(instructorUser, {
        slug: 'admin-preview-draft',
        status: 'DRAFT',
        isPublished: false,
      });

      const res = await request(app)
        .get(`/api/v1/courses/${draftCourse.slug}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('admin-preview-draft');
    });
  });

  describe('4. Course Unpublishing and Archiving Lifecycle', () => {
    it('allows instructor to unpublish their course, immediately removing it from student catalog', async () => {
      const course = await createValidCourse(instructorUser);
      // Publish
      await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      // Verify visible
      let catalog = await request(app).get('/api/v1/courses').expect(200);
      expect(catalog.body.courses.length).toBe(1);

      // Unpublish
      const unpubRes = await request(app)
        .post(`/api/v1/courses/${course._id}/unpublish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      expect(unpubRes.body.success).toBe(true);
      expect(unpubRes.body.course.status).toBe('draft');

      // Verify hidden from student catalog
      catalog = await request(app).get('/api/v1/courses').expect(200);
      expect(catalog.body.courses.length).toBe(0);
    });

    it('allows admin to archive an instructor course, removing it from student catalog', async () => {
      const course = await createValidCourse(instructorUser);
      // Publish
      await request(app)
        .post(`/api/v1/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      // Archive via admin
      const archiveRes = await request(app)
        .post(`/api/v1/courses/${course._id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(archiveRes.body.success).toBe(true);
      expect(archiveRes.body.course.status).toBe('archived');

      // Verify hidden from student catalog
      const catalog = await request(app).get('/api/v1/courses').expect(200);
      expect(catalog.body.courses.length).toBe(0);
    });
  });
});
