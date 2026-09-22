const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const RefreshToken = require('../src/models/refreshToken.model');
const tokenService = require('../src/services/token.service');
const env = require('../src/config/env');

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

describe('Phase: 7-Day HTTP-Only Cookie Authentication & RBAC', () => {
  // Helper to extract cookie from Set-Cookie header
  const getCookie = (res, cookieName = 'auth_token') => {
    const cookies = res.headers['set-cookie'];
    if (!cookies) return null;
    return cookies.find((c) => c.startsWith(`${cookieName}=`));
  };

  // Helper to extract cookie value
  const getCookieValue = (res, cookieName = 'auth_token') => {
    const raw = getCookie(res, cookieName);
    if (!raw) return null;
    const match = raw.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
  };

  describe('1. Login and Registration — HTTP-Only Cookie & Zero Token Leakage', () => {
    it('should set 7-day HTTP-only auth_token cookie on Student registration without exposing token in body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alice Student',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('alice@example.com');
      expect(res.body.data.user.role).toBe('STUDENT');

      // Security requirement: Token MUST NOT be in response JSON body
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.token).toBeUndefined();
      expect(res.body.data.accessToken).toBeUndefined();

      // Verify HTTP-only cookie
      const authCookie = getCookie(res, 'auth_token');
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/i);
      expect(authCookie).toMatch(/Path=\//i);
      expect(authCookie).toMatch(/Max-Age=604800/i); // 7 days in seconds
    });

    it('should set 7-day HTTP-only cookie on Student login and not leak token in body', async () => {
      await User.create({
        name: 'Student User',
        email: 'student@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('STUDENT');
      expect(res.body.data.accessToken).toBeUndefined();

      const authCookie = getCookie(res, 'auth_token');
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/i);
      expect(authCookie).toMatch(/Path=\//i);
    });

    it('should set 7-day HTTP-only cookie on Faculty / Instructor login', async () => {
      await User.create({
        name: 'Instructor User',
        email: 'instructor@example.com',
        password: 'Password123!',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'instructor@example.com',
          password: 'Password123!',
          expectedRole: 'INSTRUCTOR',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('INSTRUCTOR');
      expect(res.body.data.accessToken).toBeUndefined();

      const authCookie = getCookie(res, 'auth_token');
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/i);
    });

    it('should set 7-day HTTP-only cookie on Admin login', async () => {
      await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'Password123!',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Password123!',
          expectedRole: 'ADMIN',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('ADMIN');

      const authCookie = getCookie(res, 'auth_token');
      expect(authCookie).toBeDefined();
      expect(authCookie).toMatch(/HttpOnly/i);
    });

    it('should reject invalid password with 401 and not set auth cookie', async () => {
      await User.create({
        name: 'Target User',
        email: 'target@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'target@example.com',
          password: 'WrongPassword!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
      const authCookie = getCookie(res, 'auth_token');
      expect(authCookie).toBeNull();
    });

    it('should reject unknown user with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it('should reject suspended user with 403 ACCOUNT_INACTIVE and clear cookie', async () => {
      await User.create({
        name: 'Suspended Student',
        email: 'suspended@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'SUSPENDED',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'suspended@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('2. Authentication Check API (GET /api/v1/auth/me)', () => {
    it('should return user information when valid auth_token cookie is provided', async () => {
      const user = await User.create({
        name: 'Cookie Authenticated User',
        email: 'cookieauth@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const token = tokenService.generateAuthToken(user);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('cookieauth@example.com');
      expect(res.body.data.user.role).toBe('STUDENT');
    });

    it('should return 401 UNAUTHORIZED when no cookie or header is provided', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });

    it('should return 401 TOKEN_EXPIRED and clear cookie when cookie is expired', async () => {
      const user = await User.create({
        name: 'Expired User',
        email: 'expired@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      // Issue an already-expired token (-10s)
      const expiredToken = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        env.JWT_SECRET,
        { expiresIn: '-10s' }
      );

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`auth_token=${expiredToken}`]);

      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('TOKEN_EXPIRED');

      // Check that response instructed browser to clear cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const clearedCookie = cookies.find((c) => c.startsWith('auth_token=;'));
      expect(clearedCookie).toBeDefined();
    });

    it('should return 401 INVALID_TOKEN and clear cookie when cookie is tampered', async () => {
      const tamperedCookie = 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature';

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [tamperedCookie]);

      expect(res.statusCode).toBe(401);
      expect(res.body.errorCode).toBe('INVALID_TOKEN');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.startsWith('auth_token=;'))).toBe(true);
    });

    it('should return 403 ACCOUNT_INACTIVE if user was suspended after cookie was issued', async () => {
      const user = await User.create({
        name: 'Banned User',
        email: 'banned@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'SUSPENDED',
      });

      const token = tokenService.generateAuthToken(user);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [`auth_token=${token}`]);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('3. Role-Based Authorization', () => {
    let studentCookie;
    let instructorCookie;
    let adminCookie;

    beforeEach(async () => {
      const student = await User.create({
        name: 'Role Student',
        email: 'student_rbac@test.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const instructor = await User.create({
        name: 'Role Instructor',
        email: 'instructor_rbac@test.com',
        password: 'Password123!',
        role: 'INSTRUCTOR',
        status: 'ACTIVE',
      });

      const admin = await User.create({
        name: 'Role Admin',
        email: 'admin_rbac@test.com',
        password: 'Password123!',
        role: 'ADMIN',
        status: 'ACTIVE',
      });

      studentCookie = `auth_token=${tokenService.generateAuthToken(student)}`;
      instructorCookie = `auth_token=${tokenService.generateAuthToken(instructor)}`;
      adminCookie = `auth_token=${tokenService.generateAuthToken(admin)}`;
    });

    it('should allow Student to access Student auth check', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', [studentCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.role).toBe('STUDENT');
    });

    it('should forbid Student from accessing Instructor endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/instructor/courses')
        .set('Cookie', [studentCookie]);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should forbid Student from accessing Admin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Cookie', [studentCookie]);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should forbid Instructor from accessing Admin endpoints with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Cookie', [instructorCookie]);

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });

    it('should allow Admin to access Admin endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Cookie', [adminCookie]);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Logout and Session Invalidation', () => {
    it('should clear authentication cookie and revoke session on logout', async () => {
      const user = await User.create({
        name: 'Logout User',
        email: 'logout@test.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'logout@test.com', password: 'Password123!' });

      const authCookie = getCookieValue(loginRes, 'auth_token');
      const refreshCookie = getCookieValue(loginRes, 'refreshToken');

      // Logout request
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', [`auth_token=${authCookie}`, `refreshToken=${refreshCookie}`]);

      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify cookies are cleared
      const setCookies = logoutRes.headers['set-cookie'];
      expect(setCookies).toBeDefined();
      expect(setCookies.some((c) => c.startsWith('auth_token=;'))).toBe(true);
      expect(setCookies.some((c) => c.startsWith('refreshToken=;'))).toBe(true);

      // Subsequent attempt with revoked refresh token should fail
      const refreshAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refreshCookie });

      expect(refreshAttempt.statusCode).toBe(401);
    });
  });

  describe('5. CSRF Protection for State-Changing Operations', () => {
    it('should block mutating POST request with untrusted origin with 403', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', 'https://malicious-phishing-site.com')
        .send({
          email: 'student@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.errorCode).toBe('CSRF_BLOCKED');
    });

    it('should allow mutating request with permitted origin', async () => {
      await User.create({
        name: 'Origin Student',
        email: 'originstudent@example.com',
        password: 'Password123!',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Origin', 'http://localhost:3000')
        .send({
          email: 'originstudent@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
