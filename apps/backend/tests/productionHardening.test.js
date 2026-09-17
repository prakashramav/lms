const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const tokenService = require('../src/services/token.service');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Phase 10 — Production Hardening, Observability & Security', () => {
  describe('Health, Readiness & Liveness Probes', () => {
    it('GET /api/v1/health should return 200 with standard status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
    });

    it('GET /health root probe should return 200', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
    });

    it('GET /api/v1/health/ready should confirm MongoDB readiness', async () => {
      const res = await request(app).get('/api/v1/health/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('READY');
      expect(res.body.database).toBe('CONNECTED');
    });

    it('GET /ready root probe should return 200 READY', async () => {
      const res = await request(app).get('/ready');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('READY');
    });

    it('GET /api/v1/health/live should return 200 ALIVE with uptime', async () => {
      const res = await request(app).get('/api/v1/health/live');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ALIVE');
      expect(typeof res.body.uptimeSeconds).toBe('number');
    });
  });

  describe('Request ID & Tracing', () => {
    it('should generate an X-Request-ID header when none is provided', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
      expect(res.headers['x-request-id'].length).toBeGreaterThan(10);
    });

    it('should preserve and propagate client-provided X-Request-ID header', async () => {
      const customId = 'trace-client-uuid-9876-abc';
      const res = await request(app)
        .get('/api/v1/health')
        .set('X-Request-ID', customId);

      expect(res.statusCode).toBe(200);
      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    it('should sanitize and strip MongoDB query operators ($gt, $ne, $where) from request body', async () => {
      // In register endpoint, send malicious body containing $gt operator
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Injection Test',
          email: 'injection@example.com',
          password: 'Password123!',
          $where: 'sleep(5000)',
          adminFlag: { $ne: null },
        });

      // User should be registered normally without malicious keys affecting query
      expect(res.statusCode).toBe(201);
      const savedUser = await User.findOne({ email: 'injection@example.com' });
      expect(savedUser).toBeDefined();
      expect(savedUser.$where).toBeUndefined();
    });
  });

  describe('Mass Assignment Protection', () => {
    it('should prevent unauthenticated/student user from self-assigning SUPER_ADMIN role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'SUPER_ADMIN',
          permissions: ['ALL_ACCESS'],
          isSuperAdmin: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('STUDENT');

      const savedUser = await User.findOne({ email: 'hacker@example.com' });
      expect(savedUser.role).toBe('STUDENT');
      expect(savedUser.permissions).toEqual([]);
    });
  });

  describe('Cross-Role RBAC & Security Boundary Enforcement', () => {
    it('should reject unauthenticated access to admin endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/admin/users');
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
      expect(res.body.requestId).toBeDefined();
    });

    it('should reject STUDENT role access to admin endpoints with 403', async () => {
      const student = await User.create({
        name: 'Student User',
        email: 'student@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const token = tokenService.generateAccessToken(student);

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should reject INSTRUCTOR role access to admin endpoints with 403', async () => {
      const instructor = await User.create({
        name: 'Instructor User',
        email: 'instructor@example.com',
        password: 'Password123!',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });

      const token = tokenService.generateAccessToken(instructor);

      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should reject STUDENT role access to instructor endpoints with 403', async () => {
      const student = await User.create({
        name: 'Student Two',
        email: 'student2@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const token = tokenService.generateAccessToken(student);

      const res = await request(app)
        .get('/api/v1/instructor/courses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('Centralized Error Handling & Response Consistency', () => {
    it('should return standardized JSON structure with requestId for 404', async () => {
      const res = await request(app).get('/api/v1/nonexistent-route-xyz');
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('NOT_FOUND');
      expect(res.body.requestId).toBeDefined();
    });
  });
});
