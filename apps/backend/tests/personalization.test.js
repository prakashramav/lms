const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Enrollment } = require('../src/models/enrollment.model');
const { Skill, StudentSkill } = require('../src/models/skill.model');
const CareerPath = require('../src/models/careerPath.model');
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

describe('Phase 14 Personalization & Skill Intelligence Test Suite', () => {
  let studentUser;
  let studentToken;
  let testCourse;
  let testSkill;

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Personalization Student',
      email: `p_student_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    studentToken = generateAccessToken(studentUser);

    testCourse = await Course.create({
      title: 'Advanced React & Next.js Patterns',
      slug: `adv-react-${Date.now()}`,
      category: 'FRONTEND',
      difficulty: 'INTERMEDIATE',
      pricingType: 'FREE',
      status: 'PUBLISHED',
      description: 'Master advanced React hooks and Next.js full-stack patterns',
      shortDescription: 'Modern frontend engineering with Next.js',
      instructor: new mongoose.Types.ObjectId(),
    });

    testSkill = await Skill.create({
      name: 'React.js',
      slug: `react-${Date.now()}`,
      category: 'FRONTEND',
      difficulty: 'INTERMEDIATE',
    });

    const tsSkill = await Skill.create({
      name: 'TypeScript',
      slug: `typescript-${Date.now()}`,
      category: 'FRONTEND',
      difficulty: 'INTERMEDIATE',
    });

    await StudentSkill.create({
      studentId: studentUser._id,
      skillId: testSkill._id,
      masteryLevel: 'ADVANCED',
      observedScore: 88,
      practiceCount: 12,
    });

    await Enrollment.create({
      studentId: studentUser._id,
      courseId: testCourse._id,
      progressPercentage: 45,
      lastAccessedAt: new Date(),
    });

    await CareerPath.create({
      name: 'Frontend Engineer',
      slug: 'frontend-engineer',
      description: 'Modern web UI architecture specialist',
      requiredSkills: [testSkill._id, tsSkill._id],
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Skill.deleteMany({});
    await StudentSkill.deleteMany({});
    await CareerPath.deleteMany({});
  });

  describe('1. Student Learning Profile', () => {
    it('GET /api/v1/personalization/profile should return dynamic learning metrics', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.profile.activeCoursesCount).toBe(1);
      expect(res.body.profile.strongSkills.length).toBeGreaterThanOrEqual(1);
      expect(res.body.profile.strongSkills[0].name).toBe('React.js');
    });
  });

  describe('2. Smart Continue Learning Action', () => {
    it('GET /api/v1/personalization/continue-learning should provide explainable next step', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/continue-learning')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.action).toBeDefined();
      expect(res.body.action.reasonCodes).toBeDefined();
      expect(res.body.action.explanation).toBeDefined();
    });
  });

  describe('3. Career Skill Gap Analysis', () => {
    it('GET /api/v1/personalization/career-gap should calculate matched and missing skills', async () => {
      const res = await request(app)
        .get('/api/v1/personalization/career-gap?roleSlug=frontend-engineer')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.gap.matchedSkills).toContain('React.js');
      expect(res.body.gap.missingSkills.some((s) => s.name === 'TypeScript')).toBe(true);
      expect(res.body.gap.roadmapPhases.length).toBe(5);
    });
  });

  describe('4. AI Learning Coach Interaction', () => {
    it('POST /api/v1/personalization/coach should return contextual responses across modes', async () => {
      const res = await request(app)
        .post('/api/v1/personalization/coach')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          mode: 'EXPLAIN',
          prompt: 'Explain the difference between Client and Server Components',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.mode).toBe('EXPLAIN');
      expect(res.body.response).toContain('breakdown');
      expect(res.body.followUpSuggestions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
