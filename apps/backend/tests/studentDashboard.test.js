const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Module = require('../src/models/module.model');
const { Lesson } = require('../src/models/lesson.model');
const { Enrollment } = require('../src/models/enrollment.model');
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

describe('Student Dashboard API (GET /api/v1/student/dashboard)', () => {
  let studentUser;
  let instructorUser;
  let adminUser;

  let studentToken;
  let instructorToken;
  let adminToken;

  let testCourse;
  let testModule;
  let testLesson;

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Module.deleteMany({}),
      Lesson.deleteMany({}),
      Enrollment.deleteMany({}),
    ]);

    studentUser = await User.create({
      name: 'Alex Rivera',
      email: 'alex.student@example.com',
      password: 'StudentPass123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });

    instructorUser = await User.create({
      name: 'Dr. Jenkins',
      email: 'jenkins@example.com',
      password: 'InstructorPass123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });

    adminUser = await User.create({
      name: 'Admin Vance',
      email: 'vance@example.com',
      password: 'AdminPass123!',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    testCourse = await Course.create({
      title: 'Full Stack Software Engineering',
      slug: 'full-stack-software-engineering',
      shortDescription: 'From fundamentals to scale.',
      description: 'Course details.',
      category: 'Web Development',
      difficulty: 'BEGINNER',
      duration: '40 hours',
      instructor: instructorUser._id,
      status: 'PUBLISHED',
      isPublished: true,
    });

    testModule = await Module.create({
      courseId: testCourse._id,
      title: 'Module 1: JavaScript & Asynchronous Patterns',
      order: 1,
      isPublished: true,
    });

    testLesson = await Lesson.create({
      courseId: testCourse._id,
      moduleId: testModule._id,
      title: 'Mastering Async/Await',
      slug: 'mastering-async-await',
      type: 'VIDEO',
      order: 1,
      duration: 25,
      isPublished: true,
    });

    // Active enrollment for studentUser
    await Enrollment.create({
      studentId: studentUser._id,
      courseId: testCourse._id,
      status: 'ACTIVE',
      progressPercentage: 50,
      lastLessonId: testLesson._id,
    });

    studentToken = tokenService.generateAccessToken(studentUser);
    instructorToken = tokenService.generateAccessToken(instructorUser);
    adminToken = tokenService.generateAccessToken(adminUser);
  });

  it('should return 200 with real course telemetry for enrolled student', async () => {
    const res = await request(app)
      .get('/api/v1/student/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data.student).toBeDefined();
    expect(data.student.name).toBe('Alex Rivera');
    expect(data.student.email).toBe('alex.student@example.com');
    expect(data.student.role).toBe('STUDENT');

    expect(data.currentCourse).toBeDefined();
    expect(data.currentCourse.title).toBe('Full Stack Software Engineering');
    expect(data.currentCourse.currentLesson).toBe('Mastering Async/Await');
    expect(data.currentCourse.progressPercentage).toBe(50);

    expect(data.progress).toBeDefined();
    expect(data.dailyGoal).toBeDefined();
    expect(data.streak).toBeDefined();
    expect(data.career).toBeDefined();
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/api/v1/student/dashboard');
    expect(res.statusCode).toBe(401);
    expect(res.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('should return 403 Forbidden when an INSTRUCTOR attempts to access student dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/student/dashboard')
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('should return 403 Forbidden when an ADMIN attempts to access student dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/student/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN');
  });
});
