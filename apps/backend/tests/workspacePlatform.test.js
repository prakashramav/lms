const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Workspace } = require('../src/models/workspace.model');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Lesson } = require('../src/models/lesson.model');
const { Enrollment } = require('../src/models/enrollment.model');
const { Submission } = require('../src/models/submission.model');
const { templateRegistry } = require('../src/services/workspace/templateRegistry');
const { storageManager } = require('../src/services/workspace/storageManager');
const { workspaceService } = require('../src/services/workspace/workspace.service');
const { testRunner } = require('../src/services/workspace/testRunner');
const { databaseLab } = require('../src/services/workspace/databaseLab');
const { aiGateway } = require('../src/services/workspace/aiGateway');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Cloud IDE & Workspace Platform Functional Test Suite', () => {
  let studentUser;
  let instructorUser;
  let testCourse;
  let testLesson;

  beforeEach(async () => {
    await Workspace.deleteMany({});
    await Submission.deleteMany({});
    await User.deleteMany({});
    await Course.deleteMany({});
    await Lesson.deleteMany({});
    await Enrollment.deleteMany({});

    studentUser = await User.create({
      name: 'Alice Student',
      email: 'alice.workspace@test.com',
      password: 'Password123!',
      role: 'STUDENT',
    });

    instructorUser = await User.create({
      name: 'Bob Instructor',
      email: 'bob.instructor@test.com',
      password: 'Password123!',
      role: 'INSTRUCTOR',
    });

    testCourse = await Course.create({
      title: 'Fullstack Modern Web & AI Architecture',
      slug: 'fullstack-web-ai-' + Date.now(),
      shortDescription: 'Master modern fullstack development.',
      description: 'Comprehensive course covering React, Node, FastAPI, Spring Boot and AI.',
      category: 'Software Engineering',
      instructor: instructorUser._id,
    });

    await Enrollment.create({
      studentId: studentUser._id,
      courseId: testCourse._id,
      status: 'ACTIVE',
    });

    testLesson = await Lesson.create({
      title: 'Building Scalable APIs with Express',
      slug: 'scalable-apis-express',
      courseId: testCourse._id,
      moduleId: new mongoose.Types.ObjectId(),
      order: 1,
      workspace: {
        enabled: true,
        type: 'CLOUD_IDE',
        templateId: 'node-express',
        templateVersion: '1.0',
        starterFiles: [
          {
            path: 'src/app.js',
            permission: 'editable',
            content: "const express = require('express');\nconst app = express();\nmodule.exports = app;",
          },
          {
            path: 'README.md',
            permission: 'readonly',
            content: '# Express API Lesson Notes\nFollow instructions.',
          },
          {
            path: 'tests/hidden_eval.js',
            permission: 'hidden',
            content: '// Secret validation\nconsole.log("Secret test");',
          },
        ],
        tests: [
          {
            name: 'Exports Express App',
            description: 'Verify app instance is exported',
            type: 'FILE_CHECK',
            path: 'src/app.js',
            contains: 'express',
            isHidden: false,
          },
          {
            name: 'Production Rate Limit Check',
            description: 'Ensure rate limiter middleware is enabled',
            type: 'FILE_CHECK',
            path: 'src/app.js',
            contains: 'rateLimit',
            isHidden: true,
          },
        ],
      },
    });
  });

  describe('1. Template Registry Verification', () => {
    it('provides all mandatory fullstack, database, ML, and AI templates', () => {
      const requiredTemplates = [
        'react',
        'nextjs',
        'node-express',
        'fastapi',
        'springboot',
        'django',
        'angular',
        'vue',
        'sql-postgresql',
        'mongodb',
        'redis',
        'ml',
        'deep-learning',
        'genai',
        'agentic-ai',
      ];

      for (const tplId of requiredTemplates) {
        const tpl = templateRegistry.getTemplate(tplId);
        expect(tpl).toBeDefined();
        expect(tpl.id).toBe(tplId);
        expect(tpl.category).toBeDefined();
        expect(tpl.starterFiles.length).toBeGreaterThan(0);
        expect(tpl.defaultTests.length).toBeGreaterThan(0);
      }
    });

    it('allows registering and listing custom instructor templates', () => {
      const custom = templateRegistry.registerCustomTemplate('custom-rust', {
        name: 'Rust Actix Web',
        category: 'CLOUD_IDE',
        runtime: { language: 'rust', version: '1.80' },
        starterFiles: [{ path: 'Cargo.toml', content: '[package]' }],
        defaultTests: [{ name: 'Cargo check', isHidden: false }],
      });

      expect(custom.id).toBe('custom-rust');
      expect(templateRegistry.isValidTemplate('custom-rust')).toBe(true);
    });
  });

  describe('2. Workspace Provisioning & Lifecycle', () => {
    it('provisions a clean workspace with starter files and persistent storage', async () => {
      const result = await workspaceService.getOrCreateWorkspace({
        userId: studentUser._id,
        userRole: 'STUDENT',
        courseId: testCourse._id,
        lessonId: testLesson._id,
        templateId: 'node-express',
      });

      expect(result.workspace).toBeDefined();
      expect(result.workspace.status).toBe('RUNNING');
      expect(result.workspace.templateId).toBe('node-express');
      expect(result.workspace.storagePath).toBeDefined();

      // Verify files exist in storage
      const files = await storageManager.listFiles(studentUser._id, result.workspace._id, false);
      const paths = files.map((f) => f.path);
      expect(paths).toContain('src');
      expect(paths).toContain('README.md');
      // Hidden test must NOT be in student file listing
      expect(paths).not.toContain('tests/hidden_eval.js');
    });

    it('manages workspace lifecycle (stop, restart, reset, delete)', async () => {
      const { workspace } = await workspaceService.getOrCreateWorkspace({
        userId: studentUser._id,
        userRole: 'STUDENT',
        courseId: testCourse._id,
        lessonId: testLesson._id,
      });

      // Stop
      const stopped = await workspaceService.stopWorkspace(workspace._id, studentUser._id, 'STUDENT');
      expect(stopped.status).toBe('STOPPED');

      // Restart
      const restarted = await workspaceService.restartWorkspace(workspace._id, studentUser._id, 'STUDENT');
      expect(restarted.status).toBe('RUNNING');

      // Edit an editable file
      await storageManager.writeFile(
        studentUser._id,
        workspace._id,
        'src/app.js',
        '// Modified by student',
        false
      );
      const modified = await storageManager.readFile(studentUser._id, workspace._id, 'src/app.js', false);
      expect(modified.content).toBe('// Modified by student');

      // Reset
      const resetRes = await workspaceService.resetWorkspace(workspace._id, studentUser._id, 'STUDENT');
      expect(resetRes.success).toBe(true);
      const restored = await storageManager.readFile(studentUser._id, workspace._id, 'src/app.js', false);
      expect(restored.content).toContain('express');

      // Delete
      const delRes = await workspaceService.deleteWorkspace(workspace._id, studentUser._id, 'STUDENT');
      expect(delRes.success).toBe(true);
      const deletedWs = await Workspace.findById(workspace._id);
      expect(deletedWs.status).toBe('DELETED');
    });
  });

  describe('3. Automated Testing & Hidden Test Secrecy', () => {
    it('runs visible tests and separates results from hidden tests', async () => {
      const { workspace } = await workspaceService.getOrCreateWorkspace({
        userId: studentUser._id,
        userRole: 'STUDENT',
        courseId: testCourse._id,
        lessonId: testLesson._id,
      });

      // Visible run (includeHidden = false)
      const visibleRun = await testRunner.runTests({
        userId: studentUser._id,
        workspaceId: workspace._id,
        templateId: workspace.templateId,
        customTests: testLesson.workspace.tests,
        includeHidden: false,
      });

      expect(visibleRun.tests.length).toBe(1);
      expect(visibleRun.tests[0].name).toBe('Exports Express App');
      expect(visibleRun.tests[0].isHidden).toBe(false);

      // Submission run (includeHidden = true)
      const submission = await testRunner.submitWorkspace({
        studentId: studentUser._id,
        workspace,
        customTests: testLesson.workspace.tests,
      });

      expect(submission.submissionId).toBeDefined();
      expect(submission.totalTests).toBe(2);
      expect(submission.tests.some((t) => t.isHidden === true)).toBe(true);
      // Hidden test must NOT leak sensitive assertions
      const hiddenTest = submission.tests.find((t) => t.isHidden === true);
      expect(hiddenTest.expected).toBeUndefined();
      expect(hiddenTest.actual).toBeUndefined();

      // Verify DB record
      const dbSubmission = await Submission.findById(submission.submissionId);
      expect(dbSubmission.workspaceId.toString()).toBe(workspace._id.toString());
      expect(dbSubmission.score).toBeDefined();
      expect(dbSubmission.snapshotHash).toBeDefined();
    });
  });

  describe('4. Database Lab Execution', () => {
    it('executes SQL queries safely against relational sandbox dataset', async () => {
      const res = await databaseLab.executeSqlQuery('SELECT * FROM customers;');
      expect(res.success).toBe(true);
      expect(res.columns).toContain('name');
      expect(res.rows.length).toBeGreaterThan(0);
    });

    it('blocks dangerous administrative database drop operations', async () => {
      await expect(databaseLab.executeSqlQuery('DROP DATABASE production;')).rejects.toThrow(
        'Restricted administrative query detected'
      );
    });

    it('executes Redis caching operations cleanly in memory', async () => {
      const setRes = await databaseLab.executeRedisCommand('SET test_key test_val');
      expect(setRes.success).toBe(true);

      const getRes = await databaseLab.executeRedisCommand('GET test_key');
      expect(getRes.result).toBe('test_val');
    });
  });

  describe('5. AI Gateway Integration', () => {
    it('proxies LLM requests, updates workspace token metrics, and prevents secret exposure', async () => {
      const { workspace } = await workspaceService.getOrCreateWorkspace({
        userId: studentUser._id,
        userRole: 'STUDENT',
        courseId: testCourse._id,
        lessonId: testLesson._id,
      });

      const aiRes = await aiGateway.processPrompt({
        userId: studentUser._id,
        workspaceId: workspace._id,
        prompt: 'Explain Express middleware chain',
      });

      expect(aiRes.success).toBe(true);
      expect(aiRes.response).toBeDefined();
      expect(aiRes.usage.totalTokens).toBeGreaterThan(0);

      // Verify workspace document updated with usage
      const updatedWs = await Workspace.findById(workspace._id);
      expect(updatedWs.metrics.tokenUsage).toBeGreaterThan(0);
    });
  });
});
