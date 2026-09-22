const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { Course } = require('../src/models/course.model');
const { Enrollment } = require('../src/models/enrollment.model');
const Certificate = require('../src/models/certificate.model');
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

describe('Phase 14 Certificates & Verification Test Suite', () => {
  let studentUser;
  let studentToken;
  let testCourse;

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Cert Test Student',
      email: `cert_student_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    studentToken = generateAccessToken(studentUser);

    testCourse = await Course.create({
      title: 'Distributed Systems & Microservices',
      slug: `dist-sys-${Date.now()}`,
      category: 'BACKEND',
      difficulty: 'ADVANCED',
      pricingType: 'FREE',
      status: 'PUBLISHED',
      description: 'Comprehensive study of distributed consensus and event streaming',
      shortDescription: 'Master microservices and distributed computing',
      skills: ['Distributed Systems', 'Docker', 'Kubernetes'],
      instructor: new mongoose.Types.ObjectId(),
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Certificate.deleteMany({});
  });

  describe('1. Certificate Issuance Requirements', () => {
    it('should reject certificate issuance if course is incomplete (< 100%)', async () => {
      await Enrollment.create({
        studentId: studentUser._id,
        courseId: testCourse._id,
        progressPercentage: 80,
      });

      const res = await request(app)
        .post(`/api/v1/certificates/issue/${testCourse._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('100% course completion');
    });

    it('should successfully issue certificate when course completion is 100%', async () => {
      await Enrollment.create({
        studentId: studentUser._id,
        courseId: testCourse._id,
        progressPercentage: 100,
      });

      const res = await request(app)
        .post(`/api/v1/certificates/issue/${testCourse._id}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.certificate.certificateId).toMatch(/^CERT-/);
      expect(res.body.certificate.studentName).toBe('Cert Test Student');
    });
  });

  describe('2. Public Certificate Verification', () => {
    it('should publicly verify valid certificate without exposing sensitive data', async () => {
      const cert = await Certificate.create({
        certificateId: 'CERT-VERIFY123',
        studentId: studentUser._id,
        courseId: testCourse._id,
        studentName: 'Cert Test Student',
        courseTitle: 'Distributed Systems & Microservices',
        skillsEarned: ['Distributed Systems'],
        verificationUrl: 'http://localhost:3000/verify/certificate/CERT-VERIFY123',
      });

      const res = await request(app).get(`/api/v1/certificates/verify/${cert.certificateId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.verified).toBe(true);
      expect(res.body.certificateId).toBe('CERT-VERIFY123');
      expect(res.body.studentName).toBe('Cert Test Student');
      expect(res.body.password).toBeUndefined();
      expect(res.body.email).toBeUndefined();
    });

    it('should return 404 for invalid certificate ID', async () => {
      const res = await request(app).get('/api/v1/certificates/verify/CERT-INVALID999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
