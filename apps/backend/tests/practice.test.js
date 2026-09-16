const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Problem } = require('../src/models/problem.model');
const { TestCase } = require('../src/models/testCase.model');
const { Submission } = require('../src/models/submission.model');
const { ProblemDraft } = require('../src/models/problemDraft.model');
const { ProblemBookmark } = require('../src/models/problemBookmark.model');
const tokenService = require('../src/services/token.service');

let mongoServer;
let studentToken;
let studentUser;
let otherStudentToken;
let otherStudentUser;
let testProblem;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create student 1
  studentUser = await User.create({
    name: 'Coding Student',
    email: 'coder@example.com',
    password: 'StudentPass123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  studentToken = tokenService.generateAccessToken(studentUser);

  // Create student 2
  otherStudentUser = await User.create({
    name: 'Other Student',
    email: 'othercoder@example.com',
    password: 'StudentPass123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  otherStudentToken = tokenService.generateAccessToken(otherStudentUser);

  // Seed sample problem
  testProblem = await Problem.create({
    title: 'Two Sum Test',
    slug: 'two-sum-test',
    category: 'JAVASCRIPT',
    difficulty: 'EASY',
    topics: ['Arrays', 'Hash Map'],
    supportedLanguages: ['javascript'],
    description: 'Find two indices that sum up to target.',
    functionSignature: {
      name: 'twoSum',
      params: [
        { name: 'nums', type: 'number[]' },
        { name: 'target', type: 'number' },
      ],
      returnType: 'number[]',
    },
    starterCode: {
      javascript: 'function twoSum(nums, target) {\n  return [0, 1];\n}',
    },
    isPublished: true,
  });

  // Public test case
  await TestCase.create({
    problemId: testProblem._id,
    input: '[2, 7, 11, 15], 9',
    expectedOutput: '[0, 1]',
    isHidden: false,
    order: 1,
    description: 'Sample 1',
  });

  // Hidden test case
  await TestCase.create({
    problemId: testProblem._id,
    input: '[3, 2, 4], 6',
    expectedOutput: '[1, 2]',
    isHidden: true,
    order: 2,
    description: 'Hidden 1',
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Coding Practice & Online Judge API', () => {
  describe('GET /api/v1/practice/languages', () => {
    it('returns supported available languages', async () => {
      const res = await request(app).get('/api/v1/practice/languages');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const langIds = res.body.data.map((l) => l.id);
      expect(langIds).toContain('javascript');
      expect(langIds).toContain('html_css');
      expect(langIds).toContain('react');
      expect(langIds).toContain('node');
      expect(langIds).toContain('express');
      // Python and C++ should not be marked available
      expect(langIds).not.toContain('python');
    });
  });

  describe('GET /api/v1/practice/problems', () => {
    it('lists published coding problems', async () => {
      const res = await request(app).get('/api/v1/practice/problems');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.problems.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('filters problems by category and difficulty', async () => {
      const res = await request(app)
        .get('/api/v1/practice/problems')
        .query({ category: 'JAVASCRIPT', difficulty: 'EASY' });
      expect(res.status).toBe(200);
      expect(res.body.data.problems[0].category).toBe('JAVASCRIPT');
      expect(res.body.data.problems[0].difficulty).toBe('EASY');
    });

    it('searches problems by title', async () => {
      const res = await request(app)
        .get('/api/v1/practice/problems')
        .query({ search: 'Two Sum' });
      expect(res.status).toBe(200);
      expect(res.body.data.problems.some((p) => p.title.includes('Two Sum'))).toBe(true);
    });
  });

  describe('GET /api/v1/practice/problems/:slug', () => {
    it('returns problem details and ONLY public test cases (never hidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/practice/problems/${testProblem.slug}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(testProblem.title);
      expect(res.body.data.testCases).toBeDefined();
      expect(res.body.data.testCases.length).toBe(1);
      // Hidden test case must NOT be returned
      expect(res.body.data.testCases[0].input).toBe('[2, 7, 11, 15], 9');
      expect(res.body.data.testCases[0].isHidden).toBeUndefined();
    });

    it('returns 404 for nonexistent problem slug', async () => {
      const res = await request(app).get('/api/v1/practice/problems/nonexistent-slug-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/practice/problems/:problemId/run', () => {
    it('executes student code against public test cases and returns ACCEPTED', async () => {
      const code = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
`;
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/run`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'javascript',
          code,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verdict).toBe('ACCEPTED');
      expect(res.body.data.testResults[0].passed).toBe(true);
    });

    it('returns WRONG_ANSWER when student code produces wrong output', async () => {
      const wrongCode = `function twoSum(nums, target) { return [99, 99]; }`;
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/run`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'javascript',
          code: wrongCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.verdict).toBe('WRONG_ANSWER');
      expect(res.body.data.testResults[0].passed).toBe(false);
    });

    it('returns COMPILE_ERROR for syntax error', async () => {
      const brokenCode = `function twoSum(nums, target) { return [; }`;
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/run`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'javascript',
          code: brokenCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.verdict).toBe('COMPILE_ERROR');
    });

    it('rejects unsupported language', async () => {
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/run`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'unsupported_lang',
          code: 'print(1)',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/practice/problems/:problemId/submit', () => {
    it('evaluates all test cases including hidden tests and records submission', async () => {
      const correctCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) return [map.get(diff), i];
    map.set(nums[i], i);
  }
  return [];
}
`;
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'javascript',
          code: correctCode,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.verdict).toBe('ACCEPTED');
      expect(res.body.data.score).toBe(100);
      expect(res.body.data.passedTests).toBe(2);
      expect(res.body.data.totalTests).toBe(2);

      // Verify hidden test output is masked
      const hiddenResult = res.body.data.testResults.find((t) => t.isHidden);
      expect(hiddenResult.input).toBeUndefined();
      expect(hiddenResult.expectedOutput).toBeUndefined();
    });

    it('requires authentication for submission', async () => {
      const res = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/submit`)
        .send({
          language: 'javascript',
          code: 'function twoSum() {}',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Draft Autosave & Bookmarks', () => {
    it('autosaves student code draft and restores it', async () => {
      const saveRes = await request(app)
        .put(`/api/v1/practice/drafts/${testProblem._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          language: 'javascript',
          code: '// In progress draft',
        });
      expect(saveRes.status).toBe(200);
      expect(saveRes.body.data.code).toBe('// In progress draft');

      const getRes = await request(app)
        .get(`/api/v1/practice/drafts/${testProblem._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .query({ language: 'javascript' });
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.code).toBe('// In progress draft');
    });

    it('toggles bookmark on and off', async () => {
      const addBm = await request(app)
        .post(`/api/v1/practice/problems/${testProblem._id}/bookmark`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(addBm.status).toBe(200);
      expect(addBm.body.data.isBookmarked).toBe(true);

      const listBm = await request(app)
        .get('/api/v1/practice/bookmarks')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(listBm.status).toBe(200);
      expect(listBm.body.data.some((b) => b._id.toString() === testProblem._id.toString())).toBe(true);

      const removeBm = await request(app)
        .delete(`/api/v1/practice/problems/${testProblem._id}/bookmark`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(removeBm.status).toBe(200);
      expect(removeBm.body.data.isBookmarked).toBe(false);
    });
  });

  describe('Submissions & Privacy (IDOR Protection)', () => {
    let submissionId;

    beforeAll(async () => {
      const sub = await Submission.create({
        studentId: studentUser._id,
        problemId: testProblem._id,
        language: 'javascript',
        code: 'function twoSum() {}',
        status: 'COMPLETED',
        verdict: 'ACCEPTED',
        score: 100,
      });
      submissionId = sub._id;
    });

    it('allows student to view their own submission detail', async () => {
      const res = await request(app)
        .get(`/api/v1/practice/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data._id.toString()).toBe(submissionId.toString());
    });

    it('denies access to other student attempting to view submission (IDOR protection)', async () => {
      const res = await request(app)
        .get(`/api/v1/practice/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('fetches student practice progress statistics', async () => {
      const res = await request(app)
        .get('/api/v1/practice/progress')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.solvedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.difficulty).toBeDefined();
    });
  });
});
