const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
const { Enrollment } = require('../src/models/enrollment.model');
const Progress = require('../src/models/progress.model');
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

describe('Course & LMS API Integration Tests', () => {
  let studentUser;
  let instructorUser;
  let studentToken;
  let instructorToken;

  let publishedCourse;
  let draftCourse;
  let module1;
  let previewLesson;
  let lockedLesson;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
      Enrollment.deleteMany({}),
      Progress.deleteMany({}),
    ]);

    studentUser = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'Password123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    instructorUser = await User.create({
      name: 'Test Instructor',
      email: 'instructor@test.com',
      password: 'Password123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    studentToken = tokenService.generateAccessToken(studentUser);
    instructorToken = tokenService.generateAccessToken(instructorUser);

    // Published course
    publishedCourse = await Course.create({
      title: 'Full Stack JavaScript Mastery',
      slug: 'full-stack-javascript-mastery',
      shortDescription: 'From fundamentals to production deployment.',
      description: 'Comprehensive curriculum.',
      category: 'Web Development',
      difficulty: 'BEGINNER',
      skills: ['JavaScript', 'Node.js'],
      duration: '20 hours',
      instructor: instructorUser._id,
      status: 'PUBLISHED',
      isPublished: true,
      featured: true,
    });

    // Draft course (must remain hidden from student catalog)
    draftCourse = await Course.create({
      title: 'Unpublished Draft Course',
      slug: 'unpublished-draft-course',
      shortDescription: 'Hidden from public.',
      description: 'Work in progress.',
      category: 'Backend',
      difficulty: 'ADVANCED',
      instructor: instructorUser._id,
      status: 'DRAFT',
      isPublished: false,
    });

    module1 = await Module.create({
      courseId: publishedCourse._id,
      title: 'Module 1: JS Basics',
      order: 1,
      isPublished: true,
    });

    previewLesson = await Lesson.create({
      courseId: publishedCourse._id,
      moduleId: module1._id,
      title: 'Course Introduction',
      slug: 'course-intro',
      type: 'VIDEO',
      order: 1,
      duration: 10,
      videoUrl: 'https://example.com/preview.mp4',
      content: 'Preview lesson content',
      isPreview: true,
      isPublished: true,
    });

    lockedLesson = await Lesson.create({
      courseId: publishedCourse._id,
      moduleId: module1._id,
      title: 'Advanced Closures in Depth',
      slug: 'advanced-closures',
      type: 'ARTICLE',
      order: 2,
      duration: 25,
      content: 'Secret locked article content',
      isPreview: false,
      isPublished: true,
    });
  });

  describe('GET /api/v1/courses (Catalog, Search & Filter)', () => {
    it('should list only published courses with pagination', async () => {
      const res = await request(app).get('/api/v1/courses?page=1&limit=10');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].slug).toBe('full-stack-javascript-mastery');
      expect(res.body.data.total).toBe(1);
    });

    it('should filter courses by search keyword', async () => {
      const hitRes = await request(app).get('/api/v1/courses?search=JavaScript');
      expect(hitRes.body.data.items.length).toBe(1);

      const missRes = await request(app).get('/api/v1/courses?search=PythonNotFound');
      expect(missRes.body.data.items.length).toBe(0);
    });

    it('should filter courses by difficulty', async () => {
      const beginnerRes = await request(app).get('/api/v1/courses?difficulty=BEGINNER');
      expect(beginnerRes.body.data.items.length).toBe(1);

      const advancedRes = await request(app).get('/api/v1/courses?difficulty=ADVANCED');
      expect(advancedRes.body.data.items.length).toBe(0);
    });
  });

  describe('GET /api/v1/courses/:slug', () => {
    it('should return course details with modules outline for published course', async () => {
      const res = await request(app).get('/api/v1/courses/full-stack-javascript-mastery');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Full Stack JavaScript Mastery');
      expect(res.body.data.modules.length).toBe(1);
      expect(res.body.data.modules[0].lessons.length).toBe(2);

      // Lesson 1 is preview (not locked)
      expect(res.body.data.modules[0].lessons[0].isPreview).toBe(true);
      expect(res.body.data.modules[0].lessons[0].isLocked).toBe(false);

      // Lesson 2 is non-preview and user not enrolled (locked)
      expect(res.body.data.modules[0].lessons[1].isLocked).toBe(true);
    });

    it('should return 404 for unpublished draft course', async () => {
      const res = await request(app).get('/api/v1/courses/unpublished-draft-course');
      expect(res.statusCode).toBe(404);
      expect(res.body.errorCode).toBe('COURSE_NOT_FOUND');
    });
  });

  describe('POST /api/v1/enrollments (Idempotent Enrollment)', () => {
    it('should enroll authenticated student in course (201 Created)', async () => {
      const res = await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: publishedCourse._id });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enrollment.status).toBe('ACTIVE');
      expect(res.body.data.enrollment.progressPercentage).toBe(0);
    });

    it('should be idempotent: repeated enrollment returns 200 without duplicates', async () => {
      await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: publishedCourse._id });

      const repeatRes = await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: publishedCourse._id });

      expect(repeatRes.statusCode).toBe(200);
      expect(repeatRes.body.message).toContain('Already enrolled');

      // Verify only 1 enrollment record exists in DB
      const count = await Enrollment.countDocuments({ studentId: studentUser._id, courseId: publishedCourse._id });
      expect(count).toBe(1);
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/v1/enrollments')
        .send({ courseId: publishedCourse._id });

      expect(res.statusCode).toBe(401);
    });

    it('should reject INSTRUCTOR from enrolling as student with 403', async () => {
      const res = await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ courseId: publishedCourse._id });

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('Progress Tracking & Lesson Access Control', () => {
    it('should allow accessing preview lesson without enrollment', async () => {
      const res = await request(app)
        .post(`/api/v1/progress/lessons/${previewLesson._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.progress).toBeDefined();
    });

    it('should DENY starting locked non-preview lesson if not enrolled (403)', async () => {
      const res = await request(app)
        .post(`/api/v1/progress/lessons/${lockedLesson._id}/start`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('ENROLLMENT_REQUIRED');
    });

    it('should mark lesson complete after enrollment and recalculate course percentage', async () => {
      // 1. Enroll
      await request(app)
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ courseId: publishedCourse._id });

      // 2. Complete Lesson 1 (1 of 2 lessons = 50%)
      const completeRes = await request(app)
        .post(`/api/v1/progress/lessons/${previewLesson._id}/complete`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(completeRes.statusCode).toBe(200);
      expect(completeRes.body.data.progressPercentage).toBe(50);
      expect(completeRes.body.data.isCourseCompleted).toBe(false);

      // Verify Enrollment in DB updated
      const enrollment = await Enrollment.findOne({ studentId: studentUser._id, courseId: publishedCourse._id });
      expect(enrollment.progressPercentage).toBe(50);

      // 3. Complete Lesson 2 (2 of 2 lessons = 100%, status COMPLETED)
      const completeRes2 = await request(app)
        .post(`/api/v1/progress/lessons/${lockedLesson._id}/complete`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(completeRes2.statusCode).toBe(200);
      expect(completeRes2.body.data.progressPercentage).toBe(100);
      expect(completeRes2.body.data.isCourseCompleted).toBe(true);

      const finalEnrollment = await Enrollment.findOne({ studentId: studentUser._id, courseId: publishedCourse._id });
      expect(finalEnrollment.status).toBe('COMPLETED');
      expect(finalEnrollment.completedAt).toBeDefined();
    });
  });

  describe('Bookmarks API', () => {
    it('should toggle bookmark on and off for student', async () => {
      // 1. Add bookmark
      const addRes = await request(app)
        .post(`/api/v1/bookmarks/${previewLesson._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(addRes.statusCode).toBe(200);
      expect(addRes.body.data.bookmarked).toBe(true);

      // 2. List bookmarks
      const listRes = await request(app)
        .get('/api/v1/bookmarks')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.bookmarks.length).toBe(1);

      // 3. Toggle off
      const removeRes = await request(app)
        .post(`/api/v1/bookmarks/${previewLesson._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(removeRes.statusCode).toBe(200);
      expect(removeRes.body.data.bookmarked).toBe(false);
    });
  });

  describe('Course Deletion & Student Visibility Shielding', () => {
    let instructorB;
    let tokenB;
    let adminUser;
    let adminToken;
    let deletionCourse;

    beforeEach(async () => {
      instructorB = await User.create({
        name: 'Second Instructor',
        email: 'instructor.b@test.com',
        password: 'Password123!',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });
      tokenB = tokenService.generateAccessToken(instructorB);

      adminUser = await User.create({
        name: 'Platform Admin',
        email: 'admin.deletion@test.com',
        password: 'Password123!',
        role: 'ADMIN',
        permissions: ['courses.read', 'courses.publish'],
        status: 'ACTIVE',
      });
      adminToken = tokenService.generateAccessToken(adminUser);

      deletionCourse = await Course.create({
        title: 'Microservices Architecture',
        slug: 'microservices-architecture',
        shortDescription: 'Scalable backend patterns.',
        description: 'Deep dive into microservices.',
        category: 'Backend',
        difficulty: 'ADVANCED',
        instructor: instructorUser._id,
        status: 'PUBLISHED',
        isPublished: true,
      });
    });

    it('rejects student from deleting a course with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('COURSE_DELETE_FORBIDDEN');
    });

    it('rejects unauthenticated user from deleting a course with 401 Unauthorized', async () => {
      const res = await request(app).delete(`/api/v1/courses/${deletionCourse._id}`);
      expect(res.statusCode).toBe(401);
    });

    it('rejects instructor from deleting another instructor course with 403 (IDOR Protection)', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.code).toBe('COURSE_DELETE_FORBIDDEN');
    });

    it('rejects deletion with invalid MongoDB ObjectId with 400 Bad Request', async () => {
      const res = await request(app)
        .delete('/api/v1/courses/undefined')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.code).toBe('INVALID_COURSE_ID');
    });

    it('returns 404 when attempting to delete a nonexistent course', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/courses/${fakeId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.code).toBe('COURSE_NOT_FOUND');
    });

    it('allows course owner instructor to delete their own course', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Student catalog must not return the deleted course
      const listRes = await request(app).get('/api/v1/courses');
      const foundInList = listRes.body.data.items.find(
        (c) => c._id.toString() === deletionCourse._id.toString()
      );
      expect(foundInList).toBeUndefined();

      // Student direct URL must return 404
      const directRes = await request(app).get(`/api/v1/courses/${deletionCourse.slug}`);
      expect(directRes.statusCode).toBe(404);

      // Student curriculum player must return 404
      const currRes = await request(app).get(`/api/v1/courses/${deletionCourse._id}/curriculum`);
      expect(currRes.statusCode).toBe(404);

      // Search results must exclude deleted course
      const searchRes = await request(app).get('/api/v1/search?q=Microservices');
      const foundInSearch = (searchRes.body.results || []).find(
        (r) => r.id.toString() === deletionCourse._id.toString()
      );
      expect(foundInSearch).toBeUndefined();
    });

    it('allows Admin to delete any course regardless of instructor ownership', async () => {
      const res = await request(app)
        .delete(`/api/v1/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      // Repeated deletion must return 404 (Idempotent)
      const repeatRes = await request(app)
        .delete(`/api/v1/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(repeatRes.statusCode).toBe(404);
      expect(repeatRes.body.code).toBe('COURSE_NOT_FOUND');
    });

    it('allows Admin to delete course via dedicated /api/v1/admin/courses/:courseId route', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/courses/${deletionCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
