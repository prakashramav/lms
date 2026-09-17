const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const AuditLog = require('../src/models/auditLog.model');
const { validateSafeUrl, isPrivateIp } = require('../src/utils/ssrfValidator');
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

describe('Phase 13 Production Security Audit Test Suite', () => {
  let studentUser;
  let studentToken;
  let adminUser;
  let adminToken;

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Security Test Student',
      email: `student_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    studentToken = generateAccessToken(studentUser);

    adminUser = await User.create({
      name: 'Security Test Admin',
      email: `admin_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
    adminToken = generateAccessToken(adminUser);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
  });

  describe('1. SSRF Prevention & Safe URL Validation', () => {
    it('should block AWS metadata endpoint 169.254.169.254', () => {
      const res = validateSafeUrl('http://169.254.169.254/latest/meta-data/');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('prohibited');
    });

    it('should block localhost and loopback addresses', () => {
      expect(validateSafeUrl('http://localhost:5000/internal').valid).toBe(false);
      expect(validateSafeUrl('http://127.0.0.1:8080').valid).toBe(false);
      expect(validateSafeUrl('http://127.0.0.2:3000').valid).toBe(false);
    });

    it('should block private RFC 1918 subnets', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('172.16.5.1')).toBe(true);
      expect(isPrivateIp('192.168.1.100')).toBe(true);
      expect(validateSafeUrl('http://192.168.1.1/admin').valid).toBe(false);
      expect(validateSafeUrl('http://10.200.0.5/api').valid).toBe(false);
    });

    it('should reject non-HTTP protocols (file, ftp, gopher)', () => {
      expect(validateSafeUrl('file:///etc/passwd').valid).toBe(false);
      expect(validateSafeUrl('ftp://ftp.example.com').valid).toBe(false);
    });

    it('should allow legitimate public HTTP/HTTPS URLs', () => {
      const res = validateSafeUrl('https://api.github.com/users/octocat');
      expect(res.valid).toBe(true);
      expect(res.sanitizedUrl).toBe('https://api.github.com/users/octocat');
    });
  });

  describe('2. Audit Log Immutability Protection', () => {
    it('should prevent updating existing audit logs to preserve tamper-evident trail', async () => {
      const log = await AuditLog.create({
        actorId: adminUser._id,
        actorRole: 'ADMIN',
        action: 'SYSTEM_SETTINGS_UPDATE',
        resourceType: 'SETTINGS',
        requestId: 'req-sec-audit-001',
      });

      // Attempting to modify audit log must fail
      await expect(
        AuditLog.updateOne({ _id: log._id }, { $set: { action: 'TAMPERED_ACTION' } })
      ).rejects.toThrow(/immutable/i);
    });
  });

  describe('3. RBAC & IDOR Protection', () => {
    it('should block STUDENT from accessing admin endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should allow ADMIN to access admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Input Sanitization & Mongo Injection Prevention', () => {
    it('should sanitize dangerous MongoDB query operators in request body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: { $gt: '' },
          password: 'Password123!',
        });

      // Query operator was sanitized or rejected, so it should not execute arbitrary comparison
      expect([400, 401]).toContain(res.statusCode);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Security Response Headers', () => {
    it('should set security headers (X-Content-Type-Options, Frameguard)', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('DENY');
    });
  });
});
