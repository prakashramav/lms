const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Lesson } = require('../src/models/lesson.model');
const Module = require('../src/models/module.model');
const { Problem } = require('../src/models/problem.model');
const Assessment = require('../src/models/assessment.model');
const AssessmentAttempt = require('../src/models/assessmentAttempt.model');
const { AIConversation } = require('../src/models/aiConversation.model');
const { AIMessage } = require('../src/models/aiMessage.model');
const tokenService = require('../src/services/token.service');

let mongoServer;
let studentUser;
let studentToken;
let otherUser;
let otherToken;
let sampleCourse;
let sampleModule;
let sampleLesson;
let sampleProblem;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create student 1
  studentUser = await User.create({
    name: 'AI Learner',
    email: 'ailearner@example.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  studentToken = tokenService.generateAccessToken(studentUser);

  // Create student 2
  otherUser = await User.create({
    name: 'Other Student',
    email: 'otherai@example.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  otherToken = tokenService.generateAccessToken(otherUser);

  // Create course, module, and lesson
  sampleCourse = await Course.create({
    title: 'Modern JavaScript Mastery',
    slug: 'modern-javascript-mastery',
    shortDescription: 'Deep dive into JS',
    description: 'Learn closures, promises, and async/await.',
    category: 'JavaScript',
    difficulty: 'INTERMEDIATE',
    instructor: new mongoose.Types.ObjectId(),
    status: 'PUBLISHED',
    isPublished: true,
  });

  sampleModule = await Module.create({
    courseId: sampleCourse._id,
    title: 'Advanced Functions',
    order: 1,
    isPublished: true,
  });

  sampleLesson = await Lesson.create({
    courseId: sampleCourse._id,
    moduleId: sampleModule._id,
    title: 'Understanding Closures',
    slug: 'understanding-closures',
    type: 'ARTICLE',
    content: 'A closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).',
    order: 1,
    isPublished: true,
  });

  // Create coding problem
  sampleProblem = await Problem.create({
    title: 'Two Sum',
    slug: 'two-sum-ai-test',
    category: 'JAVASCRIPT',
    difficulty: 'EASY',
    topics: ['Arrays', 'Hash Map'],
    supportedLanguages: ['javascript'],
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.',
    functionSignature: {
      name: 'twoSum',
      params: [
        { name: 'nums', type: 'number[]' },
        { name: 'target', type: 'number' },
      ],
      returnType: 'number[]',
    },
    starterCode: {
      javascript: 'function twoSum(nums, target) {}',
    },
    isPublished: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('AI Tutor & Personalized Learning Assistant API', () => {
  let createdConversationId;
  let assistantMsgId;

  describe('1. Conversation Lifecycle & IDOR Protection', () => {
    it('POST /api/v1/ai/conversations - should create a new conversation with default GUIDED mode', async () => {
      const res = await request(app)
        .post('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'JavaScript Learning Chat',
          mode: 'GUIDED',
          context: {
            courseId: sampleCourse._id,
            lessonId: sampleLesson._id,
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.mode).toBe('GUIDED');
      expect(res.body.data.studentId.toString()).toBe(studentUser._id.toString());
      createdConversationId = res.body.data._id;
    });

    it('GET /api/v1/ai/conversations - should list student conversations', async () => {
      const res = await request(app)
        .get('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversations.length).toBeGreaterThan(0);
      expect(res.body.data.conversations[0]._id).toBe(createdConversationId);
    });

    it('GET /api/v1/ai/conversations/:id - should get conversation detail for owner', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.conversation._id).toBe(createdConversationId);
      expect(Array.isArray(res.body.data.messages)).toBe(true);
    });

    it('GET /api/v1/ai/conversations/:id - IDOR: other student cannot access conversation', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('2. Message Sending & Socratic Pedagogy', () => {
    it('POST /api/v1/ai/conversations/:id/messages - should reject empty messages', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ message: '   ' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_INPUT');
    });

    it('POST /api/v1/ai/conversations/:id/messages - should send message and receive pedagogical response', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'What is a closure in JavaScript?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.userMessage.content).toBe('What is a closure in JavaScript?');
      expect(res.body.data.assistantMessage.content).toBeDefined();
      expect(res.body.data.assistantMessage.role).toBe('ASSISTANT');
      assistantMsgId = res.body.data.assistantMessage._id;
    });

    it('POST /api/v1/ai/conversations/:id/messages - Socratic check: asking for solution in GUIDED mode gives guidance not raw code', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Give me the solution to Two Sum',
          mode: 'GUIDED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assistantMessage.content).toContain('Work Through This Together');
    });

    it('POST /api/v1/ai/conversations/:id/messages - DIRECT mode provides direct solution breakdown', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Give me the solution to Two Sum',
          mode: 'DIRECT',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.assistantMessage.content).toContain('Direct Solution Breakdown');
    });
  });

  describe('3. Specialized Educational AI Services', () => {
    it('POST /api/v1/ai/hint - Tier 1 should provide conceptual hint', async () => {
      const res = await request(app)
        .post('/api/v1/ai/hint')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          problemId: sampleProblem._id,
          tier: 1,
          currentCode: 'function twoSum() {}',
          language: 'javascript',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tier).toBe(1);
      expect(res.body.data.hint).toContain('Hint 1: Conceptual Understanding');
    });

    it('POST /api/v1/ai/hint - Tier 3 should provide pseudocode hint', async () => {
      const res = await request(app)
        .post('/api/v1/ai/hint')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          problemId: sampleProblem._id,
          tier: 3,
          currentCode: 'function twoSum() {}',
          language: 'javascript',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.tier).toBe(3);
      expect(res.body.data.hint).toContain('Hint 3: Pseudocode Outline');
    });

    it('POST /api/v1/ai/explain - should provide diagnostic error breakdown', async () => {
      const res = await request(app)
        .post('/api/v1/ai/explain')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          problemId: sampleProblem._id,
          code: 'function twoSum() { return nums[100].toString(); }',
          language: 'javascript',
          error: 'TypeError: Cannot read properties of undefined (reading toString)',
          stderr: 'TypeError: Cannot read properties of undefined',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.explanation).toContain('Diagnostic Error Breakdown');
      expect(res.body.data.explanation).toContain('What happened');
    });

    it('POST /api/v1/ai/code-review - should provide structured rubric', async () => {
      const res = await request(app)
        .post('/api/v1/ai/code-review')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          problemId: sampleProblem._id,
          code: 'function twoSum(nums, target) { const map = {}; for (let i=0; i<nums.length; i++) { const diff = target - nums[i]; if (map[diff] !== undefined) return [map[diff], i]; map[nums[i]] = i; } }',
          language: 'javascript',
          executionResult: { verdict: 'ACCEPTED', executionTime: 12, memory: 34 },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review).toContain('AI Code Review Report');
      expect(res.body.data.review).toContain('Complexity Analysis');
    });

    it('POST /api/v1/ai/summarize - should summarize lesson content', async () => {
      const res = await request(app)
        .post('/api/v1/ai/summarize')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          lessonId: sampleLesson._id,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toContain('Lesson Summary & Key Takeaways');
    });

    it('POST /api/v1/ai/study-plan - should generate personalized schedule', async () => {
      const res = await request(app)
        .post('/api/v1/ai/study-plan')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          targetSkill: 'Full-Stack JavaScript',
          availableHours: 8,
          targetDate: '3 weeks',
          currentLevel: 'Intermediate',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studyPlan).toContain('Personalized Learning Plan');
    });

    it('POST /api/v1/ai/generate-practice - should generate practice questions', async () => {
      const res = await request(app)
        .post('/api/v1/ai/generate-practice')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          topic: 'JavaScript Closures',
          difficulty: 'MEDIUM',
          count: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions.length).toBeGreaterThan(0);
    });
  });

  describe('4. Feedback & Deletion', () => {
    it('POST /api/v1/ai/messages/:id/feedback - should submit helpful feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/ai/messages/${assistantMsgId}/feedback`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          rating: 'HELPFUL',
          reason: 'Clear explanation of lexical scope.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await AIMessage.findById(assistantMsgId);
      expect(updated.feedback.rating).toBe('HELPFUL');
      expect(updated.feedback.reason).toContain('lexical scope');
    });

    it('DELETE /api/v1/ai/conversations/:id - should delete conversation for owner', async () => {
      const res = await request(app)
        .delete(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await AIConversation.findById(createdConversationId);
      expect(check).toBeNull();
    });
  });
});
