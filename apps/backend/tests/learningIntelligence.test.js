const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Lesson } = require('../src/models/lesson.model');
const Module = require('../src/models/module.model');
const { Enrollment } = require('../src/models/enrollment.model');
const { Skill } = require('../src/models/skill.model');
const { Goal } = require('../src/models/goal.model');
const { Badge } = require('../src/models/badge.model');
const Mistake = require('../src/models/mistake.model');
const SpacedReview = require('../src/models/spacedReview.model');
const { Recommendation } = require('../src/models/recommendation.model');
const { LearningProfile } = require('../src/models/learningProfile.model');
const { seedIntelligenceBasics } = require('../src/services/intelligence/intelligenceSeed');
const tokenService = require('../src/services/token.service');

let mongoServer;
let studentToken;
let studentUser;
let student2Token;
let student2User;
let instructorToken;
let instructorUser;
let adminToken;
let testCourse;
let testLesson;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed default skills, badges, flags
  await seedIntelligenceBasics();

  // Create Student 1
  studentUser = await User.create({
    name: 'Intelligence Student',
    email: 'intel_student@test.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  studentToken = tokenService.generateAccessToken(studentUser);

  // Create Student 2
  student2User = await User.create({
    name: 'Second Student',
    email: 'student2@test.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  student2Token = tokenService.generateAccessToken(student2User);

  // Create Instructor
  instructorUser = await User.create({
    name: 'Intel Instructor',
    email: 'intel_instructor@test.com',
    password: 'Password123!',
    role: 'INSTRUCTOR',
    status: 'ACTIVE',
  });
  instructorToken = tokenService.generateAccessToken(instructorUser);

  // Create Admin
  const adminUser = await User.create({
    name: 'Intel Admin',
    email: 'intel_admin@test.com',
    password: 'Password123!',
    role: 'ADMIN',
    status: 'ACTIVE',
    permissions: ['analytics.read'],
  });
  adminToken = tokenService.generateAccessToken(adminUser);

  // Create published course, module, lesson
  testCourse = await Course.create({
    title: 'Advanced React Architecture',
    slug: 'advanced-react-architecture',
    shortDescription: 'In-depth architecture and state design.',
    description: 'Comprehensive curriculum on modern React.',
    instructor: instructorUser._id,
    category: 'DEVELOPMENT',
    difficulty: 'INTERMEDIATE',
    isPublished: true,
    status: 'PUBLISHED',
  });

  const testModule = await Module.create({
    courseId: testCourse._id,
    title: 'Component Lifecycle & State',
    order: 1,
    isPublished: true,
  });

  testLesson = await Lesson.create({
    courseId: testCourse._id,
    moduleId: testModule._id,
    title: 'Custom Hooks Deep Dive',
    slug: 'custom-hooks-deep-dive',
    order: 1,
    isPublished: true,
  });

  // Enroll student 1
  await Enrollment.create({
    studentId: studentUser._id,
    courseId: testCourse._id,
    status: 'ACTIVE',
    progressPercentage: 50,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 11: Learning Intelligence API & Capabilities', () => {
  describe('1. Learning Profile & Skills', () => {
    it('GET /api/v1/student/learning-profile: generates profile transparently with default preferences', async () => {
      const res = await request(app)
        .get('/api/v1/student/learning-profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentId.toString()).toBe(studentUser._id.toString());
      expect(res.body.data.preferences.personalizedRecommendations).toBe(true);
    });

    it('GET /api/v1/student/skills: returns platform-defined skills with mastery levels', async () => {
      const res = await request(app)
        .get('/api/v1/student/skills')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('masteryLevel');
    });

    it('GET /api/v1/student/weak-topics: returns weak topics array', async () => {
      const res = await request(app)
        .get('/api/v1/student/weak-topics')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Recommendations Engine', () => {
    it('GET /api/v1/student/recommendations: delivers recommendations with explainable why reason', async () => {
      const res = await request(app)
        .get('/api/v1/student/recommendations')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.recommendations)).toBe(true);
      if (res.body.data.recommendations.length > 0) {
        const rec = res.body.data.recommendations[0];
        expect(rec).toHaveProperty('reason');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('type');
      }
    });

    it('POST /api/v1/student/recommendations/:id/feedback: allows feedback on recommendation', async () => {
      // Create a test recommendation
      const rec = await Recommendation.create({
        studentId: studentUser._id,
        type: 'CONTINUE_LESSON',
        title: 'Continue Custom Hooks',
        reason: 'Because this lesson is next in your course.',
        resourceType: 'Lesson',
        resourceId: testLesson._id,
        priority: 85,
        estimatedTime: 20,
      });

      const res = await request(app)
        .post(`/api/v1/student/recommendations/${rec._id}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ rating: 'helpful', comment: 'Great suggestion!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback).toBe('HELPFUL');
    });

    it('POST /api/v1/student/recommendations/:id/dismiss: dismisses recommendation', async () => {
      const rec = await Recommendation.create({
        studentId: studentUser._id,
        type: 'PRACTICE_QUIZ',
        title: 'Practice React Basics',
        reason: 'To strengthen your foundations.',
        resourceType: 'Lesson',
        resourceId: testLesson._id,
        priority: 70,
      });

      const res = await request(app)
        .post(`/api/v1/student/recommendations/${rec._id}/dismiss`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DISMISSED');
    });
  });

  describe('3. Daily Learning Plan', () => {
    it('GET /api/v1/student/daily-plan: retrieves or generates realistic plan', async () => {
      const res = await request(app)
        .get('/api/v1/student/daily-plan')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('tasks');
      expect(Array.isArray(res.body.data.tasks)).toBe(true);
      expect(res.body.data.estimatedDuration).toBeGreaterThan(0);
    });

    it('PATCH /api/v1/student/daily-plan/:taskId: toggles task completion', async () => {
      const planRes = await request(app)
        .get('/api/v1/student/daily-plan')
        .set('Authorization', `Bearer ${studentToken}`);

      const taskId = planRes.body.data.tasks[0]?.id;
      if (taskId) {
        const updateRes = await request(app)
          .patch(`/api/v1/student/daily-plan/${taskId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ isCompleted: true });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.success).toBe(true);
        const task = updateRes.body.data.tasks.find((t) => t.id === taskId);
        expect(task.isCompleted).toBe(true);
      }
    });
  });

  describe('4. Student Goals CRUD', () => {
    let createdGoalId;

    it('POST /api/v1/student/goals: creates a learning goal', async () => {
      const res = await request(app)
        .post('/api/v1/student/goals')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'COURSE_COMPLETION',
          title: 'Complete Advanced React Architecture',
          description: 'Finish all lessons and quizzes',
          target: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Complete Advanced React Architecture');
      expect(res.body.data.status).toBe('IN_PROGRESS');
      createdGoalId = res.body.data._id;
    });

    it('GET /api/v1/student/goals: returns active student goals', async () => {
      const res = await request(app)
        .get('/api/v1/student/goals')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PATCH /api/v1/student/goals/:goalId: updates goal progress', async () => {
      const res = await request(app)
        .patch(`/api/v1/student/goals/${createdGoalId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ currentValue: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentValue).toBe(5);
    });

    it('DELETE /api/v1/student/goals/:goalId: deletes goal', async () => {
      const res = await request(app)
        .delete(`/api/v1/student/goals/${createdGoalId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Mistake Book & Spaced Revision', () => {
    let mistakeId;
    let reviewId;

    beforeAll(async () => {
      const mistake = await Mistake.create({
        studentId: studentUser._id,
        sourceType: 'ASSESSMENT',
        sourceId: new mongoose.Types.ObjectId(),
        topic: 'React Hooks',
        mistakeType: 'INCORRECT_CHOICE',
        promptSnippet: 'What is the rule of hooks?',
        studentAnswer: ['Call inside conditions'],
        explanation: 'Hooks must be called at top level.',
        resolved: false,
      });
      mistakeId = mistake._id.toString();

      const rev = await SpacedReview.create({
        studentId: studentUser._id,
        topic: 'React Hooks',
        performanceScore: 40,
        nextReview: new Date(),
        intervalDays: 1,
      });
      reviewId = rev._id.toString();
    });

    it('GET /api/v1/student/mistakes: retrieves personal mistake history', async () => {
      const res = await request(app)
        .get('/api/v1/student/mistakes')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mistakes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.mistakes[0].topic).toBe('React Hooks');
    });

    it('POST /api/v1/student/mistakes/:mistakeId/retry: resolves mistake upon retry', async () => {
      const res = await request(app)
        .post(`/api/v1/student/mistakes/${mistakeId}/retry`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resolved).toBe(true);
    });

    it('GET /api/v1/student/revision: retrieves spaced revision queue', async () => {
      const res = await request(app)
        .get('/api/v1/student/revision')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('dueReviews');
    });

    it('POST /api/v1/student/revision/:topicId/complete: marks revision as reviewed and advances interval', async () => {
      const res = await request(app)
        .post(`/api/v1/student/revision/${reviewId}/complete`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ performance: 'GOOD' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.intervalDays).toBeGreaterThan(1);
    });
  });

  describe('6. Achievements & Weekly Review', () => {
    it('GET /api/v1/student/achievements: lists earned and unearned badges', async () => {
      const res = await request(app)
        .get('/api/v1/student/achievements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/student/weekly-review: computes factual review and narrative', async () => {
      const res = await request(app)
        .get('/api/v1/student/weekly-review')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('currentWeek');
      expect(res.body.data).toHaveProperty('aiSummary');
    });
  });

  describe('7. Security, Privacy & RBAC Isolation', () => {
    it('prevents Student from accessing Instructor Intelligence API (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/instructor/courses/${testCourse._id}/intelligence`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('prevents Student 2 from viewing or updating Student 1 mistakes (404/403 Isolation)', async () => {
      const mistake = await Mistake.create({
        studentId: studentUser._id,
        sourceType: 'ASSESSMENT',
        sourceId: new mongoose.Types.ObjectId(),
        topic: 'Privacy Topic',
        mistakeType: 'INCORRECT_CHOICE',
        promptSnippet: 'Private question',
        resolved: false,
      });

      const res = await request(app)
        .get(`/api/v1/student/mistakes/${mistake._id}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(404);
    });

    it('allows Instructor to view own course intelligence', async () => {
      const res = await request(app)
        .get(`/api/v1/instructor/courses/${testCourse._id}/intelligence`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('funnel');
      expect(res.body.data).toHaveProperty('supportSignals');
    });

    it('allows Admin to view platform-wide learning health and recommendation telemetry', async () => {
      const healthRes = await request(app)
        .get('/api/v1/admin/analytics/learning-health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(healthRes.status).toBe(200);
      expect(healthRes.body.success).toBe(true);
      expect(healthRes.body.data).toHaveProperty('activeLearners');
      expect(healthRes.body.data).toHaveProperty('recommendations');

      const recRes = await request(app)
        .get('/api/v1/admin/analytics/recommendations')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(recRes.status).toBe(200);
      expect(recRes.body.success).toBe(true);
      expect(recRes.body.data).toHaveProperty('breakdown');
    });
  });
});
