const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Enrollment } = require('../src/models/enrollment.model');
const { Lesson } = require('../src/models/lesson.model');
const Module = require('../src/models/module.model');
const { Skill, StudentSkill } = require('../src/models/skill.model');
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

describe('Phase 24 AI Personalization, Adaptive Learning & Intelligence Test Suite', () => {
  let studentUser;
  let studentToken;
  let sampleCourse;
  let sampleLesson;
  let jsSkill;
  let reactSkill;

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Ada Lovelace',
      email: `ada_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    studentToken = generateAccessToken(studentUser);

    sampleCourse = await Course.create({
      title: 'Full-Stack React & Node Architecture',
      slug: `fullstack-react-${Date.now()}`,
      category: 'WEB_DEVELOPMENT',
      difficulty: 'INTERMEDIATE',
      pricingType: 'FREE',
      status: 'PUBLISHED',
      description: 'End-to-end full stack web architecture',
      shortDescription: 'Modern web engineering',
      instructor: new mongoose.Types.ObjectId(),
    });

    const sampleModule = await Module.create({
      courseId: sampleCourse._id,
      title: 'State Architecture',
      order: 1,
    });

    sampleLesson = await Lesson.create({
      title: 'Advanced State Management with Zustand',
      slug: 'advanced-state-management-with-zustand',
      courseId: sampleCourse._id,
      moduleId: sampleModule._id,
      order: 1,
      duration: 25,
      type: 'VIDEO',
      isPublished: true,
    });

    jsSkill = await Skill.create({
      name: 'JavaScript',
      slug: `js-${Date.now()}`,
      category: 'FRONTEND',
      difficulty: 'BEGINNER',
    });

    reactSkill = await Skill.create({
      name: 'React.js',
      slug: `react-${Date.now()}`,
      category: 'FRONTEND',
      difficulty: 'INTERMEDIATE',
    });

    // Student has mastered JavaScript
    await StudentSkill.create({
      studentId: studentUser._id,
      skillId: jsSkill._id,
      masteryLevel: 'MASTERED',
      observedScore: 92,
    });

    // Student is currently enrolled
    await Enrollment.create({
      studentId: studentUser._id,
      courseId: sampleCourse._id,
      progressPercentage: 20,
      lastAccessedAt: new Date(),
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});
    await Skill.deleteMany({});
    await StudentSkill.deleteMany({});
  });

  describe('1. Next Best Action Engine', () => {
    it('GET /api/v1/personalization/next-action should prioritize incomplete lesson in active course', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/next-action')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.actionType).toBe('COMPLETE_LESSON');
      expect(res.body.data.title).toBe(sampleLesson.title);
      expect(res.body.data.explanation).toContain('Full-Stack React & Node Architecture');
    });
  });

  describe('2. Dynamic Learning Path & Prerequisite Ordering', () => {
    it('GET /api/v1/personalization/learning-path should enforce prerequisite constraints', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/learning-path?goal=frontend-developer')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.careerGoal).toBe('Frontend Developer');
      expect(res.body.data.path).toBeInstanceOf(Array);
      expect(res.body.data.path.length).toBeGreaterThan(0);

      // Verify Tier 1 has skills including javascript
      const tier1 = res.body.data.path[0];
      expect(tier1.name).toBe('Foundations');
      const jsInTier1 = tier1.skills.find((s) => s.canonical === 'javascript');
      expect(jsInTier1).toBeDefined();
      expect(jsInTier1.status).toBe('COMPLETED');
    });
  });

  describe('3. Skill Gap Analysis', () => {
    it('GET /api/v1/personalization/skill-gaps should categorize strong, developing, and missing skills', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/skill-gaps?goal=frontend-developer')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.strongSkills.some((s) => s.name === 'JavaScript')).toBe(true);
      expect(res.body.data.missingSkills.length).toBeGreaterThan(0);
      expect(res.body.data.recommendedActions.length).toBeGreaterThan(0);
    });
  });

  describe('4. Personalized Daily Plan', () => {
    it('GET /api/v1/personalization/daily-plan should return structured schedule blocks', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/daily-plan')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetMinutes).toBe(60);
      expect(res.body.data.schedule).toBeInstanceOf(Array);
      expect(res.body.data.schedule.length).toBe(3);
      expect(res.body.data.weeklyObjectives).toBeDefined();
    });
  });

  describe('5. Recommendation Feedback', () => {
    it('POST /api/v1/personalization/feedback should accept and record user feedback', async () => {
      const res = await request(app)
        .post('/api/v1/personalization/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recommendationId: new mongoose.Types.ObjectId(),
          feedback: 'HELPFUL',
          reason: 'Directly aligned with my career roadmap',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recorded');
    });
  });

  describe('6. Cold-Start Onboarding & Safe Profile Reset', () => {
    it('POST /api/v1/personalization/onboarding should initialize student preferences', async () => {
      const res = await request(app)
        .post('/api/v1/personalization/onboarding')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          careerGoal: 'backend-developer',
          skillLevel: 'BEGINNER',
          preferredPace: 'INTENSIVE',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.careerGoal).toBe('backend-developer');
    });

    it('POST /api/v1/personalization/reset should rebuild profile safely', async () => {
      const res = await request(app)
        .post('/api/v1/personalization/reset')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recalculated');
    });
  });
});
