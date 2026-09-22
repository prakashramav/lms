const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { generateAccessToken } = require('../src/services/token.service');
const aiTutorV2 = require('../src/services/ai/aiTutorV2.service');
const { executeAiTool } = require('../src/services/ai/aiToolRegistry');

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

describe('Phase 16 - AI Tutor 2.0 & Tool Registry', () => {
  let studentUser;
  let otherStudent;
  let studentToken;

  beforeEach(async () => {
    await User.deleteMany({});

    studentUser = await User.create({
      name: 'Primary Student',
      email: 'student@tutor.test',
      password: 'Password123!',
      role: 'STUDENT',
      isVerified: true,
    });

    otherStudent = await User.create({
      name: 'Other Student',
      email: 'other@tutor.test',
      password: 'Password123!',
      role: 'STUDENT',
      isVerified: true,
    });

    studentToken = generateAccessToken(studentUser);
  });

  describe('1. AI Tutor 2.0 Modes', () => {
    it('should generate Socratic questions without revealing direct solution', async () => {
      const result = await aiTutorV2.generateSocraticQuestion({
        concept: 'React useEffect dependency array',
        studentQuestion: 'Why is my effect running on every single render?',
        currentContext: { courseName: 'React Deep Dive', lessonTitle: 'Effect Hook' },
      });

      expect(result.mode).toBe('SOCRATIC');
      expect(result.concept).toBe('React useEffect dependency array');
      expect(result.guidingQuestions).toBeDefined();
      expect(result.encouragement).toBeDefined();
    });

    it('should evaluate student explanation in Teach-Back mode', async () => {
      const result = await aiTutorV2.evaluateTeachBack({
        concept: 'Closures',
        studentExplanation: 'A closure is when a function has access to variables from another function even after it ends.',
        targetLevel: 'INTERMEDIATE',
      });

      expect(result.mode).toBe('TEACH_BACK');
      expect(result.concept).toBe('Closures');
      expect(result.feedback).toBeDefined();
    });

    it('should provide multi-level explanations adapted to level', async () => {
      const beginner = await aiTutorV2.explainConceptAtLevel({
        concept: 'Promises',
        level: 'BEGINNER',
      });
      expect(beginner.level).toBe('BEGINNER');
      expect(beginner.explanation).toBeDefined();

      const advanced = await aiTutorV2.explainConceptAtLevel({
        concept: 'Promises',
        level: 'ADVANCED',
      });
      expect(advanced.level).toBe('ADVANCED');
    });

    it('should serve progressive hints tier-by-tier', async () => {
      const hint1 = await aiTutorV2.getProgressiveHint({
        problemTitle: 'Two Sum',
        problemDescription: 'Find two indices that sum up to target.',
        hintTier: 1,
      });
      expect(hint1.hintTier).toBe(1);
      expect(hint1.nextTierAvailable).toBe(2);

      const hint2 = await aiTutorV2.getProgressiveHint({
        problemTitle: 'Two Sum',
        problemDescription: 'Find two indices that sum up to target.',
        hintTier: 2,
      });
      expect(hint2.hintTier).toBe(2);
      expect(hint2.nextTierAvailable).toBe(3);
    });

    it('should safely explain code without arbitrary execution', async () => {
      const res = await aiTutorV2.explainCodeSafely({
        code: 'function memoize(fn) { const cache = {}; return function(...args) { const k = JSON.stringify(args); return cache[k] = cache[k] || fn(...args); }; }',
        language: 'javascript',
      });
      expect(res.language).toBe('javascript');
      expect(res.explanation).toBeDefined();
    });
  });

  describe('2. Unified AI Tool Registry & Context Security Boundaries', () => {
    it('should execute authorized tool for authenticated student', async () => {
      const result = await executeAiTool(studentUser, 'getSkillProfile');
      expect(result.status).toBe('SUCCESS');
      expect(result.toolName).toBe('getSkillProfile');
      expect(result.data.studentId.toString()).toBe(studentUser._id.toString());
    });

    it('should block context violation when trying to access other student data', async () => {
      await expect(
        executeAiTool(studentUser, 'getSkillProfile', { studentId: otherStudent._id })
      ).rejects.toThrow('Security violation');
    });

    it('should reject unknown tool executions', async () => {
      await expect(
        executeAiTool(studentUser, 'deleteDatabase')
      ).rejects.toThrow('Unauthorized or unknown AI tool');
    });

    it('should invoke tool via HTTP assistant endpoint', async () => {
      const res = await request(app)
        .post('/api/v1/ai/assistant/execute-tool')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          toolName: 'getSkillProfile',
          params: {},
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.toolName).toBe('getSkillProfile');
    });
  });
});
