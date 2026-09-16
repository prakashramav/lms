const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const RefreshToken = require('../src/models/refreshToken.model');

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
  await RefreshToken.deleteMany({});
});

describe('Authentication & RBAC API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a student successfully with role STUDENT and return tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.user.password).toBeUndefined();
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();

      // Check cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/refreshToken=/);
    });

    it('should prevent privilege escalation: registering with role ADMIN still yields role STUDENT', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker Joe',
          email: 'hacker@example.com',
          password: 'Password123!',
          role: 'ADMIN',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('STUDENT');
    });

    it('should reject duplicate email with 409', async () => {
      await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Jane Clone',
        email: 'jane@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(409);
      expect(res.body.errorCode).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('should reject weak password with 400', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Weak User',
        email: 'weak@example.com',
        password: 'weak',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      await User.create({
        name: 'Suspended User',
        email: 'suspended@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'SUSPENDED',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'student@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('student@example.com');
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'student@example.com',
        password: 'WrongPassword!',
      });

      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject suspended account with 403', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'suspended@example.com',
        password: 'Password123!',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('ACCOUNT_INACTIVE');
    });

    it('should reject login if user role does not match expectedRole (Cross-App Protection)', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'student@example.com',
        password: 'Password123!',
        expectedRole: 'ADMIN',
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('ROLE_MISMATCH');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should reject request with 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('should return user profile when valid Bearer token is provided', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Profile User',
        email: 'profile@example.com',
        password: 'Password123!',
      });

      const token = reg.body.data.accessToken;

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('profile@example.com');
      expect(res.body.data.user.role).toBe('STUDENT');
    });
  });

  describe('Refresh Token Rotation & Logout', () => {
    it('should rotate refresh token and provide new access token', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Refresh Tester',
        email: 'refresh@example.com',
        password: 'Password123!',
      });

      const rawRefreshToken = reg.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(refreshRes.statusCode).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).toBeDefined();
      expect(refreshRes.body.data.refreshToken).not.toBe(rawRefreshToken);

      // Re-using the old refresh token must be rejected (replay attack prevention)
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(replayRes.statusCode).toBe(401);
      expect(replayRes.body.errorCode).toBe('INVALID_REFRESH_TOKEN');
    });

    it('should logout and invalidate refresh token', async () => {
      const reg = await request(app).post('/api/v1/auth/register').send({
        name: 'Logout Tester',
        email: 'logout@example.com',
        password: 'Password123!',
      });

      const rawRefreshToken = reg.body.data.refreshToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: rawRefreshToken });

      expect(logoutRes.statusCode).toBe(200);

      // Attempting to refresh with revoked token fails
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: rawRefreshToken });

      expect(refreshRes.statusCode).toBe(401);
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    let studentToken;
    let instructorToken;
    let adminToken;

    beforeEach(async () => {
      const student = await User.create({
        name: 'Student User',
        email: 's@test.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const instructor = await User.create({
        name: 'Instructor User',
        email: 'i@test.com',
        password: 'Password123!',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });

      const admin = await User.create({
        name: 'Admin User',
        email: 'a@test.com',
        password: 'Password123!',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

      const sLogin = await request(app).post('/api/v1/auth/login').send({ email: 's@test.com', password: 'Password123!' });
      studentToken = sLogin.body.data.accessToken;

      const iLogin = await request(app).post('/api/v1/auth/login').send({ email: 'i@test.com', password: 'Password123!' });
      instructorToken = iLogin.body.data.accessToken;

      const aLogin = await request(app).post('/api/v1/auth/login').send({ email: 'a@test.com', password: 'Password123!' });
      adminToken = aLogin.body.data.accessToken;
    });

    it('should deny STUDENT access to Admin endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should deny INSTRUCTOR access to Admin endpoint with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should ALLOW ADMIN access to Admin endpoint with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.systemStatus).toBe('OPERATIONAL');
    });
  });

  describe('Forgot & Reset Password Flow', () => {
    it('should generate reset token and allow password reset', async () => {
      await User.create({
        name: 'Reset User',
        email: 'resetme@example.com',
        password: 'OldPassword123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      // 1. Forgot password request
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'resetme@example.com' });

      expect(forgotRes.statusCode).toBe(200);
      const devToken = forgotRes.body.devResetToken;
      expect(devToken).toBeDefined();

      // 2. Reset password request
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: devToken,
          password: 'BrandNewPassword456!',
        });

      expect(resetRes.statusCode).toBe(200);

      // 3. Login with old password fails
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'resetme@example.com',
        password: 'OldPassword123!',
      });
      expect(oldLogin.statusCode).toBe(401);

      // 4. Login with new password succeeds
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'resetme@example.com',
        password: 'BrandNewPassword456!',
      });
      expect(newLogin.statusCode).toBe(200);
      expect(newLogin.body.data.accessToken).toBeDefined();
    });
  });
});
