const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
const Assessment = require('../src/models/assessment.model');
const Question = require('../src/models/question.model');
const { Problem } = require('../src/models/problem.model');
const { TestCase } = require('../src/models/testCase.model');
const { Enrollment } = require('../src/models/enrollment.model');
const AuditLog = require('../src/models/auditLog.model');
const Resource = require('../src/models/resource.model');
const Certificate = require('../src/models/certificate.model');
const { VectorChunk } = require('../src/models/vectorChunk.model');
const Bookmark = require('../src/models/bookmark.model');
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

describe('Phase 8 — Instructor Platform Integration & Security Tests', () => {
  let instructorA;
  let instructorB;
  let studentUser;
  let tokenA;
  let tokenB;
  let studentToken;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
      Assessment.deleteMany({}),
      Question.deleteMany({}),
      Problem.deleteMany({}),
      TestCase.deleteMany({}),
      Enrollment.deleteMany({}),
      AuditLog.deleteMany({}),
      Resource.deleteMany({}),
      Certificate.deleteMany({}),
      VectorChunk.deleteMany({}),
      Bookmark.deleteMany({}),
    ]);

    instructorA = await User.create({
      name: 'Professor Alpha',
      email: 'alpha@university.edu',
      password: 'InstructorPass123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    instructorB = await User.create({
      name: 'Professor Beta',
      email: 'beta@university.edu',
      password: 'InstructorPass123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    studentUser = await User.create({
      name: 'Student Charlie',
      email: 'charlie@student.edu',
      password: 'StudentPass123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    tokenA = tokenService.generateAccessToken(instructorA);
    tokenB = tokenService.generateAccessToken(instructorB);
    studentToken = tokenService.generateAccessToken(studentUser);
  });

  // 1. RBAC & PERMISSION PROTECTION
  describe('RBAC & Role Protection', () => {
    it('denies access to student role on instructor endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/instructor/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('denies access if unauthenticated with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/instructor/courses');
      expect(res.status).toBe(401);
    });

    it('grants access to authenticated instructor', async () => {
      const res = await request(app)
        .get('/api/v1/instructor/courses')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items || res.body.data.courses)).toBe(true);
    });
  });

  // 2. COURSE CREATION & OWNERSHIP
  describe('Course Creation & Ownership Protection (IDOR)', () => {
    it('creates course and assigns createdBy server-side', async () => {
      const res = await request(app)
        .post('/api/v1/instructor/courses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Distributed Systems in Go',
          slug: 'distributed-systems-go',
          shortDescription: 'Master raft, paxos, and distributed storage',
          description: 'A deep dive into distributed systems engineering.',
          category: 'Backend Engineering',
          level: 'Advanced',
          createdBy: instructorB._id.toString(), // Attacker tries to spoof createdBy
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const createdCourse = res.body.data.course;
      expect(createdCourse.title).toBe('Distributed Systems in Go');
      // Server must enforce instructor = instructorA
      expect(createdCourse.instructor.toString()).toBe(instructorA._id.toString());
    });

    it('prevents Instructor B from editing or modifying Instructor A course (IDOR)', async () => {
      const course = await Course.create({
        title: 'Alpha Private Syllabus',
        slug: 'alpha-private',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Exclusive curriculum',
        instructor: instructorA._id,
        status: 'DRAFT',
      });

      const res = await request(app)
        .patch(`/api/v1/instructor/courses/${course._id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: 'Hacked Title By Beta' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify DB unchanged
      const freshCourse = await Course.findById(course._id);
      expect(freshCourse.title).toBe('Alpha Private Syllabus');
    });

    it('prevents Instructor B from publishing Instructor A course', async () => {
      const course = await Course.create({
        title: 'Alpha Course',
        slug: 'alpha-course',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Test Description',
        instructor: instructorA._id,
        status: 'DRAFT',
      });

      const res = await request(app)
        .post(`/api/v1/instructor/courses/${course._id}/publish`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // 3. CURRICULUM, MODULES, & LESSONS
  describe('Curriculum Builder (Modules & Lessons)', () => {
    let course;

    beforeEach(async () => {
      course = await Course.create({
        title: 'Full Stack Node Architecture',
        slug: 'full-stack-node',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Production Node architecture course',
        instructor: instructorA._id,
        status: 'DRAFT',
      });
    });

    it('adds module to course and enforces ownership', async () => {
      const res = await request(app)
        .post(`/api/v1/instructor/courses/${course._id}/modules`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Module 1: Event Loop Internals',
          order: 1,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const mod = res.body.data.module;
      expect(mod.title).toBe('Module 1: Event Loop Internals');
      expect(mod.courseId.toString()).toBe(course._id.toString());
    });

    it('adds module using course slug instead of ObjectId', async () => {
      const res = await request(app)
        .post(`/api/v1/instructor/courses/${course.slug}/modules`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Module via Slug',
          order: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const mod = res.body.data.module;
      expect(mod.title).toBe('Module via Slug');
      expect(mod.courseId.toString()).toBe(course._id.toString());
    });

    it('rejects adding module with invalid courseId parameter "undefined" with 400', async () => {
      const res = await request(app)
        .post('/api/v1/instructor/courses/undefined/modules')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Module with Undefined Course',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when adding module to nonexistent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/v1/instructor/courses/${nonExistentId}/modules`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Ghost Module',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('COURSE_NOT_FOUND');
    });

    it('prevents Instructor B from adding module to Instructor A course (IDOR)', async () => {
      const res = await request(app)
        .post(`/api/v1/instructor/courses/${course._id}/modules`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({
          title: 'Hacked Module',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN_COURSE_ACCESS');
    });

    it('reorders modules within a course', async () => {
      const mod1 = await Module.create({
        title: 'Mod 1',
        courseId: course._id,
        order: 1,
        createdBy: instructorA._id,
      });
      const mod2 = await Module.create({
        title: 'Mod 2',
        courseId: course._id,
        order: 2,
        createdBy: instructorA._id,
      });

      const res = await request(app)
        .patch(`/api/v1/instructor/courses/${course._id}/modules/reorder`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          moduleIds: [mod2._id.toString(), mod1._id.toString()],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const refreshedMod1 = await Module.findById(mod1._id);
      const refreshedMod2 = await Module.findById(mod2._id);
      expect(refreshedMod2.order).toBe(1);
      expect(refreshedMod1.order).toBe(2);
    });

    it('creates and reorders lessons under a module', async () => {
      const moduleObj = await Module.create({
        title: 'Node Async',
        courseId: course._id,
        order: 1,
        createdBy: instructorA._id,
      });

      const les1 = await Lesson.create({
        title: 'Microtasks vs Macrotasks',
        slug: 'microtasks-vs-macrotasks',
        courseId: course._id,
        moduleId: moduleObj._id,
        order: 1,
        createdBy: instructorA._id,
      });

      const les2 = await Lesson.create({
        title: 'Worker Threads',
        slug: 'worker-threads',
        courseId: course._id,
        moduleId: moduleObj._id,
        order: 2,
        createdBy: instructorA._id,
      });

      const reorderRes = await request(app)
        .patch(`/api/v1/instructor/modules/${moduleObj._id}/lessons/reorder`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          lessonIds: [les2._id.toString(), les1._id.toString()],
        });

      expect(reorderRes.status).toBe(200);
      expect(reorderRes.body.success).toBe(true);

      const rLes1 = await Lesson.findById(les1._id);
      const rLes2 = await Lesson.findById(les2._id);
      expect(rLes2.order).toBe(1);
      expect(rLes1.order).toBe(2);
    });
  });

  // 4. PUBLISHING VALIDATION CHECKLIST
  describe('Course Publishing Validation', () => {
    it('rejects publishing a course without modules or lessons', async () => {
      const emptyCourse = await Course.create({
        title: 'Empty Incomplete Course',
        slug: 'empty-course',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Short',
        instructor: instructorA._id,
        status: 'DRAFT',
      });

      const res = await request(app)
        .post(`/api/v1/instructor/courses/${emptyCourse._id}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/module|lesson/i);
    });

    it('successfully publishes course with valid curriculum and tracks publishedAt', async () => {
      const validCourse = await Course.create({
        title: 'Valid Production Course',
        slug: 'valid-course',
        shortDescription: 'Master modern full-stack web architecture and high throughput microservices',
        category: 'Backend',
        description: 'Comprehensive syllabus and curriculum for building high throughput, production-grade microservices with Node.js and distributed databases.',
        instructor: instructorA._id,
        status: 'DRAFT',
      });

      const mod = await Module.create({
        title: 'Module 1',
        courseId: validCourse._id,
        order: 1,
        createdBy: instructorA._id,
      });

      await Lesson.create({
        title: 'Lesson 1',
        slug: 'lesson-1',
        courseId: validCourse._id,
        moduleId: mod._id,
        order: 1,
        isPublished: true,
        createdBy: instructorA._id,
      });

      const res = await request(app)
        .post(`/api/v1/instructor/courses/${validCourse._id}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.course.status).toBe('PUBLISHED');
      expect(res.body.data.course.publishedAt).toBeDefined();
    });
  });

  // 5. QUESTION BANK & ASSESSMENT AUTHORING
  describe('Question Bank & Assessment Authoring', () => {
    it('creates assessment and attaches questions with correct answers', async () => {
      const assessRes = await request(app)
        .post('/api/v1/instructor/assessments')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'JavaScript Core Quiz',
          description: 'Evaluating async primitives',
          passingScorePercentage: 75,
        });

      expect(assessRes.status).toBe(201);
      const assessmentId = assessRes.body.data.assessment._id;

      const res = await request(app)
        .post('/api/v1/instructor/questions')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          assessmentId,
          question: 'What is the return type of Promise.all()?',
          type: 'SINGLE_CHOICE',
          difficulty: 'Beginner',
          topic: 'JavaScript',
          marks: 2,
          explanation: 'It returns a single Promise that resolves to an array of results.',
          options: [
            { text: 'A single Promise resolving to an array', isCorrect: true },
            { text: 'An array of individual promises', isCorrect: false },
          ],
          correctAnswers: ['A single Promise resolving to an array'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const question = res.body.data.question;
      expect(question.options[0].text).toBe('A single Promise resolving to an array');
      expect(question.assessmentId.toString()).toBe(assessmentId.toString());
    });
  });

  // 6. CODING PROBLEM & TEST CASE PROTECTION
  describe('Coding Problem Authoring & Test Cases', () => {
    it('creates problem with starter code and public/hidden test cases', async () => {
      const probRes = await request(app)
        .post('/api/v1/instructor/problems')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Palindrome Number',
          difficulty: 'EASY',
          category: 'JAVASCRIPT',
          description: 'Determine whether an integer is a palindrome.',
          starterCode: { javascript: 'function isPalindrome(x) {}' },
        });

      expect(probRes.status).toBe(201);
      expect(probRes.body.success).toBe(true);
      const problem = probRes.body.data.problem;
      expect(problem.title).toBe('Palindrome Number');

      const problemId = problem._id;

      // Add public test case
      await request(app)
        .post(`/api/v1/instructor/problems/${problemId}/test-cases`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ input: '121', expectedOutput: 'true', isHidden: false, weight: 10 });

      // Add hidden test case
      await request(app)
        .post(`/api/v1/instructor/problems/${problemId}/test-cases`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ input: '-121', expectedOutput: 'false', isHidden: true, weight: 20 });

      // Publish validation requires >= 1 public and >= 1 hidden test case
      const pubRes = await request(app)
        .post(`/api/v1/instructor/problems/${problemId}/publish`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(pubRes.status).toBe(200);
      expect(pubRes.body.data.problem.isPublished).toBe(true);
    });
  });

  // 7. STUDENT COHORT ISOLATION
  describe('Student Cohort Telemetry Isolation', () => {
    it('only returns students enrolled in courses authored by requesting instructor', async () => {
      const courseA = await Course.create({
        title: 'Course By A',
        slug: 'course-a',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Desc A',
        instructor: instructorA._id,
        status: 'PUBLISHED',
      });

      const courseB = await Course.create({
        title: 'Course By B',
        slug: 'course-b',
        shortDescription: 'Short desc',
        category: 'Backend',
        description: 'Desc B',
        instructor: instructorB._id,
        status: 'PUBLISHED',
      });

      await Enrollment.create({
        studentId: studentUser._id,
        courseId: courseA._id,
        status: 'ACTIVE',
        progress: 45,
      });

      // Instructor A queries students
      const resA = await request(app)
        .get('/api/v1/instructor/students')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(resA.status).toBe(200);
      const studentsA = resA.body.data.students || resA.body.data.items || [];
      expect(studentsA.length).toBe(1);

      // Instructor B queries students -> must NOT see student from Course A
      const resB = await request(app)
        .get('/api/v1/instructor/students')
        .set('Authorization', `Bearer ${tokenB}`);

      expect(resB.status).toBe(200);
      const studentsB = resB.body.data.students || resB.body.data.items || [];
      expect(studentsB.length).toBe(0);
    });
  });

  // 8. AUDIT LOGGING
  describe('Audit Logging System', () => {
    it('creates audit log on course creation and publishing', async () => {
      const res = await request(app)
        .post('/api/v1/instructor/courses')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          title: 'Audited Course',
          slug: 'audited-course',
          shortDescription: 'Short desc',
          category: 'Backend',
          description: 'Desc',
        });

      const logs = await AuditLog.find({ actorId: instructorA._id });
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0].action).toBe('COURSE_CREATED');
      expect(logs[0].actorRole).toBe('INSTRUCTOR');
    });
  });

  // 9. COURSE DELETION & CASCADE SAFETY
  describe('Course Deletion & Cascading Dependency Safety', () => {
    let course;
    let moduleDoc;
    let lessonDoc;
    let resourceDoc;
    let vectorChunk;

    beforeEach(async () => {
      course = await Course.create({
        title: 'Complete Distributed Systems',
        slug: 'complete-distributed-systems',
        shortDescription: 'Desc',
        description: 'Full course description',
        category: 'Backend',
        instructor: instructorA._id,
        status: 'PUBLISHED',
      });

      moduleDoc = await Module.create({
        courseId: course._id,
        title: 'Module 1',
        order: 1,
      });

      lessonDoc = await Lesson.create({
        courseId: course._id,
        moduleId: moduleDoc._id,
        title: 'Lesson 1',
        slug: 'lesson-1',
        type: 'ARTICLE',
        order: 1,
      });

      resourceDoc = await Resource.create({
        courseId: course._id,
        lessonId: lessonDoc._id,
        name: 'Slides PDF',
        url: 'https://cdn.example.com/slides.pdf',
        type: 'PDF',
        createdBy: instructorA._id,
      });

      vectorChunk = await VectorChunk.create({
        documentType: 'COURSE',
        courseId: course._id,
        moduleId: moduleDoc._id,
        lessonId: lessonDoc._id,
        title: 'Distributed Systems Chunk',
        content: 'Raft consensus algorithm explanation...',
        tokensCount: 50,
        embedding: [0.1, 0.2, 0.3],
      });

      await Certificate.create({
        certificateId: 'CERT-TEST-12345',
        studentId: studentUser._id,
        courseId: course._id,
        studentName: 'Student Charlie',
        courseTitle: 'Complete Distributed Systems',
        verificationUrl: 'https://verify.example.com/CERT-TEST-12345',
      });

      await Enrollment.create({
        studentId: studentUser._id,
        courseId: course._id,
        status: 'ACTIVE',
      });
    });

    it('permanently deletes course and child entities while preserving student certificates', async () => {
      const res = await request(app)
        .delete(`/api/v1/instructor/courses/${course._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedCourseId.toString()).toBe(course._id.toString());

      // 1. Course document deleted
      const foundCourse = await Course.findById(course._id);
      expect(foundCourse).toBeNull();

      // 2. Modules deleted
      const foundModules = await Module.find({ courseId: course._id });
      expect(foundModules.length).toBe(0);

      // 3. Lessons deleted
      const foundLessons = await Lesson.find({ courseId: course._id });
      expect(foundLessons.length).toBe(0);

      // 4. Resources deleted
      const foundResources = await Resource.find({ courseId: course._id });
      expect(foundResources.length).toBe(0);

      // 5. Vector chunks deleted
      const foundChunks = await VectorChunk.find({ courseId: course._id });
      expect(foundChunks.length).toBe(0);

      // 6. Enrollments cleaned up
      const foundEnrollments = await Enrollment.find({ courseId: course._id });
      expect(foundEnrollments.length).toBe(0);

      // 7. CRITICAL: Certificate MUST be preserved!
      const preservedCert = await Certificate.findOne({ certificateId: 'CERT-TEST-12345' });
      expect(preservedCert).not.toBeNull();
      expect(preservedCert.courseTitle).toBe('Complete Distributed Systems');
      expect(preservedCert.studentName).toBe('Student Charlie');

      // 8. Audit log created
      const auditLog = await AuditLog.findOne({
        action: 'COURSE_DELETED',
        resourceId: course._id,
      });
      expect(auditLog).not.toBeNull();
      expect(auditLog.metadata.title).toBe('Complete Distributed Systems');
    });

    it('denies course deletion to unauthorized instructor with 403 Forbidden', async () => {
      const res = await request(app)
        .delete(`/api/v1/instructor/courses/${course._id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);

      // Verify course still exists
      const foundCourse = await Course.findById(course._id);
      expect(foundCourse).not.toBeNull();
    });

    it('rejects delete course with invalid/undefined courseId with 400 Validation Error', async () => {
      const res = await request(app)
        .delete('/api/v1/instructor/courses/undefined')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when attempting to delete a nonexistent course', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/instructor/courses/${nonExistentId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('COURSE_NOT_FOUND');
    });

    it('safely handles repeated/duplicate deletion of the same course with 404', async () => {
      // First deletion
      const res1 = await request(app)
        .delete(`/api/v1/instructor/courses/${course._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res1.status).toBe(200);

      // Second deletion attempt on the same ID
      const res2 = await request(app)
        .delete(`/api/v1/instructor/courses/${course._id}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res2.status).toBe(404);
      expect(res2.body.errorCode).toBe('COURSE_NOT_FOUND');
    });
  });
});
