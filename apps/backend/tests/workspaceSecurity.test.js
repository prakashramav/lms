const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { Workspace } = require('../src/models/workspace.model');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Lesson } = require('../src/models/lesson.model');
const { Enrollment } = require('../src/models/enrollment.model');
const { workspaceService } = require('../src/services/workspace/workspace.service');
const { storageManager } = require('../src/services/workspace/storageManager');
const { processManager } = require('../src/services/workspace/processManager');
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

describe('Cloud IDE & Learning Workspace Security Audit Suite', () => {
  let studentA;
  let studentB;
  let instructorUser;
  let testCourse;
  let workspaceA;

  beforeEach(async () => {
    await Workspace.deleteMany({});
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});

    studentA = await User.create({
      name: 'Student Alice',
      email: 'alice.sec@test.com',
      password: 'Password123!',
      role: 'STUDENT',
    });

    studentB = await User.create({
      name: 'Student Bob',
      email: 'bob.sec@test.com',
      password: 'Password123!',
      role: 'STUDENT',
    });

    instructorUser = await User.create({
      name: 'Instructor Carol',
      email: 'carol.sec@test.com',
      password: 'Password123!',
      role: 'INSTRUCTOR',
    });

    testCourse = await Course.create({
      title: 'Security Hardened Systems',
      slug: 'security-hardened-systems-' + Date.now(),
      shortDescription: 'Security engineering course.',
      description: 'Penetration testing and sandbox isolation.',
      category: 'Cybersecurity',
      instructor: instructorUser._id,
    });

    await Enrollment.create({
      studentId: studentA._id,
      courseId: testCourse._id,
      status: 'ACTIVE',
    });

    // Provision workspace for Student A
    const res = await workspaceService.getOrCreateWorkspace({
      userId: studentA._id,
      userRole: 'STUDENT',
      courseId: testCourse._id,
      templateId: 'react',
    });
    workspaceA = res.workspace;
  });

  describe('1. IDOR & Workspace Isolation', () => {
    it('blocks Student B from accessing Student A workspace metadata', async () => {
      await expect(
        workspaceService.getWorkspaceById(workspaceA._id, studentB._id, 'STUDENT')
      ).rejects.toThrow('Unauthorized: You do not have access to this workspace');
    });

    it('blocks un-enrolled students from provisioning course workspaces', async () => {
      await expect(
        workspaceService.getOrCreateWorkspace({
          userId: studentB._id,
          userRole: 'STUDENT',
          courseId: testCourse._id,
          templateId: 'react',
        })
      ).rejects.toThrow('Forbidden: You must be enrolled in this course');
    });
  });

  describe('2. Path Traversal & Filesystem Containment', () => {
    it('prevents directory traversal using ../ in file paths', () => {
      const wsDir = storageManager.getWorkspaceDir(studentA._id, workspaceA._id);

      expect(() => {
        storageManager.resolveSafePath(wsDir, '../../../../etc/passwd');
      }).toThrow(/Path traversal violation/);

      expect(() => {
        storageManager.resolveSafePath(wsDir, '..\\..\\windows\\system32');
      }).toThrow(/Path traversal violation/);
    });

    it('detects and rejects null byte injections in file paths', () => {
      const wsDir = storageManager.getWorkspaceDir(studentA._id, workspaceA._id);
      expect(() => {
        storageManager.resolveSafePath(wsDir, 'src/App.jsx\0.jpg');
      }).toThrow('Null byte detected in path');
    });
  });

  describe('3. File Permission Enforcement & Tamper Protection', () => {
    it('blocks students from modifying read-only starter files', async () => {
      // package.json is marked as readonly in react template
      await expect(
        storageManager.writeFile(
          studentA._id,
          workspaceA._id,
          'package.json',
          '{"hacked": true}',
          false // isInstructor = false
        )
      ).rejects.toThrow(/Permission denied: File "package.json" is read-only/);
    });

    it('blocks students from deleting read-only files', async () => {
      await expect(
        storageManager.deleteFile(
          studentA._id,
          workspaceA._id,
          'package.json',
          false // isInstructor = false
        )
      ).rejects.toThrow(/Permission denied: Read-only file cannot be deleted/);
    });
  });

  describe('4. Hidden Test Quarantine & Secrecy', () => {
    it('strictly hides tests/App.test.jsx from student file listings', async () => {
      const studentFiles = await storageManager.listFiles(studentA._id, workspaceA._id, false);
      const studentPaths = studentFiles.map((f) => f.path);
      expect(studentPaths).not.toContain('tests/App.test.jsx');
    });

    it('blocks students from reading hidden test files directly', async () => {
      await expect(
        storageManager.readFile(studentA._id, workspaceA._id, 'tests/App.test.jsx', false)
      ).rejects.toThrow('Access denied: Protected file cannot be accessed');
    });

    it('allows instructors to read and configure hidden test files', async () => {
      const instructorFile = await storageManager.readFile(
        studentA._id,
        workspaceA._id,
        'tests/App.test.jsx',
        true // isInstructor = true
      );
      expect(instructorFile.content).toBeDefined();
    });
  });

  describe('5. Environment Sanitization & Secret Shielding', () => {
    it('strips host secrets (JWT_SECRET, database connection strings) from child environment', () => {
      process.env.JWT_SECRET = 'super_secret_jwt_key_12345';
      process.env.MONGODB_URI = 'mongodb://root:secretpass@localhost:27017';

      const sanitized = processManager.getSanitizedEnv({
        CUSTOM_STUDENT_VAR: 'hello',
        SECRET_TOKEN: 'attempted_leak',
      });

      expect(sanitized.JWT_SECRET).toBeUndefined();
      expect(sanitized.MONGODB_URI).toBeUndefined();
      expect(sanitized.SECRET_TOKEN).toBeUndefined();
      expect(sanitized.CUSTOM_STUDENT_VAR).toBe('hello');
    });
  });

  describe('6. AI Gateway Rate Limiting & Abuse Prevention', () => {
    it('enforces maximum hourly request limits on AI Gateway', async () => {
      aiGateway.rateLimitMap.set(workspaceA._id.toString(), new Array(30).fill(Date.now()));

      await expect(
        aiGateway.processPrompt({
          userId: studentA._id,
          workspaceId: workspaceA._id.toString(),
          prompt: 'Generate code',
        })
      ).rejects.toThrow(/AI Gateway rate limit exceeded/);
    });
  });
});
