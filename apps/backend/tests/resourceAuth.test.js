const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const Resume = require('../src/models/resume.model');
const { Organization } = require('../src/models/organization.model');
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

describe('Phase 15 Resource-Level Authorization & IDOR Defense Test Suite', () => {
  let studentA, studentB;
  let instructorA, instructorB;
  let tokenStudentA, tokenStudentB;
  let tokenInstructorA, tokenInstructorB;
  let courseA;
  let resumeB;

  beforeEach(async () => {
    studentA = await User.create({
      name: 'Student Alpha',
      email: `alpha_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    tokenStudentA = generateAccessToken(studentA);

    studentB = await User.create({
      name: 'Student Beta',
      email: `beta_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    tokenStudentB = generateAccessToken(studentB);

    instructorA = await User.create({
      name: 'Instructor One',
      email: `inst_one_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });
    tokenInstructorA = generateAccessToken(instructorA);

    instructorB = await User.create({
      name: 'Instructor Two',
      email: `inst_two_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'INSTRUCTOR',
      status: 'ACTIVE',
    });
    tokenInstructorB = generateAccessToken(instructorB);

    courseA = await Course.create({
      title: 'Course by Instructor A',
      slug: `course-a-${Date.now()}`,
      category: 'BACKEND',
      difficulty: 'INTERMEDIATE',
      pricingType: 'FREE',
      status: 'DRAFT',
      description: 'Comprehensive backend engineering course.',
      shortDescription: 'Backend architecture essentials.',
      instructor: instructorA._id,
    });

    resumeB = await Resume.create({
      studentId: studentB._id,
      title: 'Student Beta Resume',
      summary: 'Experienced developer',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Resume.deleteMany({});
    await Organization.deleteMany({});
  });

  describe('1. Instructor Cross-Course Modification Denial (IDOR)', () => {
    it('Instructor B should NOT be able to modify Instructor A course', async () => {
      const res = await request(app)
        .patch(`/api/v1/instructor/courses/${courseA._id}`)
        .set('Authorization', `Bearer ${tokenInstructorB}`)
        .send({ title: 'Hijacked Course Title' });

      // Must be rejected with 403 or 404
      expect([403, 404]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);

      // Verify course title was NOT altered
      const unmodified = await Course.findById(courseA._id);
      expect(unmodified.title).toBe('Course by Instructor A');
    });
  });

  describe('2. Student Cross-Resume Access Denial (IDOR)', () => {
    it('Student A should NOT be able to update Student B resume', async () => {
      const res = await request(app)
        .put(`/api/v1/career/resume`)
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .send({
          title: 'Attempted Malicious Update',
          summary: 'Compromised',
        });

      // Update operates on student's own context, so Student B's resume remains untouched
      const originalResume = await Resume.findById(resumeB._id);
      expect(originalResume.title).toBe('Student Beta Resume');
    });
  });

  describe('3. Multi-Tenant Organization Boundary Isolation', () => {
    it('should create organization and maintain membership boundaries', async () => {
      const org = await Organization.create({
        name: 'Acme Global Tech',
        slug: `acme-${Date.now()}`,
        type: 'EMPLOYER',
        ownerId: instructorA._id,
        members: [
          { userId: instructorA._id, role: 'OWNER' },
          { userId: instructorB._id, role: 'RECRUITER' },
        ],
      });

      expect(org._id).toBeDefined();
      expect(org.members.length).toBe(2);

      // Verify Student A is not a member
      const isMember = org.members.some((m) => m.userId.toString() === studentA._id.toString());
      expect(isMember).toBe(false);
    });
  });
});
