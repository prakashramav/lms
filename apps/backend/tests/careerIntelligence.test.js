const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { seedCareerEcosystem } = require('../src/services/career/careerSeed');
const { seedIntelligenceBasics } = require('../src/services/intelligence/intelligenceSeed');
const tokenService = require('../src/services/token.service');
const Job = require('../src/models/job.model');
const CareerPath = require('../src/models/careerPath.model');
const Resume = require('../src/models/resume.model');
const Portfolio = require('../src/models/portfolio.model');
const { JobApplication } = require('../src/models/application.model');

let mongoServer;
let studentToken;
let studentUser;
let student2Token;
let student2User;
let adminToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Seed baseline intelligence and career ecosystem
  await seedIntelligenceBasics();
  await seedCareerEcosystem();

  // Create primary student
  studentUser = await User.create({
    name: 'Career Student',
    email: 'career_student@test.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  studentToken = tokenService.generateAccessToken(studentUser);

  // Create second student for IDOR and privacy isolation tests
  student2User = await User.create({
    name: 'Second Student',
    email: 'career_student2@test.com',
    password: 'Password123!',
    role: 'STUDENT',
    status: 'ACTIVE',
  });
  student2Token = tokenService.generateAccessToken(student2User);

  // Create Admin
  adminUser = await User.create({
    name: 'Placement Admin',
    email: 'placement_admin@test.com',
    password: 'Password123!',
    role: 'ADMIN',
    status: 'ACTIVE',
    adminPermissions: ['analytics.view', 'settings.manage'],
  });
  adminToken = tokenService.generateAccessToken(adminUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Phase 12: Career Intelligence, Placement & Industry Ecosystem', () => {
  let createdJobId;
  let createdResumeId;
  let createdAppId;
  let fullStackPath;

  // ================= 1. CAREER PATHS & ROADMAPS =================
  describe('Career Paths & Skill Gaps', () => {
    it('should list all published career paths', async () => {
      const res = await request(app).get('/api/v1/career/paths');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      fullStackPath = res.body.data.find((p) => p.slug === 'full-stack-developer') || res.body.data[0];
      expect(fullStackPath).toBeDefined();
      expect(fullStackPath.name).toBe('Full Stack Developer');
    });

    it('should fetch career path details by slug', async () => {
      const res = await request(app).get(`/api/v1/career/paths/${fullStackPath.slug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(fullStackPath.slug);
      expect(res.body.data.roadmapStages.length).toBeGreaterThan(0);
    });

    it('should fetch career roadmap stages', async () => {
      const res = await request(app).get(`/api/v1/career/roadmap/${fullStackPath._id}`);
      expect(res.status).toBe(200);
      expect(res.body.data.stages.length).toBeGreaterThan(0);
      expect(res.body.data.stages[0].title).toBeDefined();
    });

    it('should calculate student skill gaps without humiliating labels', async () => {
      const res = await request(app)
        .get('/api/v1/student/skill-gaps')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.careerPath).toBeDefined();
      expect(Array.isArray(res.body.data.alreadyPracticing)).toBe(true);
      expect(Array.isArray(res.body.data.needsPractice)).toBe(true);
      expect(Array.isArray(res.body.data.notStarted)).toBe(true);
      expect(typeof res.body.data.completionPercentage).toBe('number');
    });

    it('should get or lazily initialize student career readiness profile', async () => {
      const res = await request(app)
        .get('/api/v1/student/career-profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.targetRole).toBeDefined();
      expect(res.body.data.readinessBreakdown).toBeDefined();
      expect(typeof res.body.data.readinessScore).toBe('number');
    });
  });

  // ================= 2. PERSONAL CAREER PLAN =================
  describe('Personal Career Plan', () => {
    it('should retrieve student career plan', async () => {
      const res = await request(app)
        .get('/api/v1/student/career-plan')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.milestones.length).toBeGreaterThan(0);
      expect(res.body.data.weeklyTime).toBe(10);
    });

    it('should toggle milestone completion and recalculate progress percentage', async () => {
      const res = await request(app)
        .post('/api/v1/student/career-plan/milestones/toggle')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ milestoneIndex: 0, completed: true });

      expect(res.status).toBe(200);
      expect(res.body.data.milestones[0].completed).toBe(true);
      expect(res.body.data.progress).toBeGreaterThan(0);
    });
  });

  // ================= 3. JOB BOARD & SEARCH =================
  describe('Job Discovery & Matching', () => {
    it('should search jobs with server-side pagination and match indicators', async () => {
      const res = await request(app)
        .get('/api/v1/jobs?limit=5')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination.total).toBeGreaterThan(0);

      const firstJob = res.body.data[0];
      createdJobId = firstJob._id;
      expect(firstJob.title).toBeDefined();
      expect(firstJob.companyId).toBeDefined();
      expect(Array.isArray(firstJob.matchingSignals)).toBe(true);
    });

    it('should filter jobs by keyword and remote setting', async () => {
      const res = await request(app).get('/api/v1/jobs?keyword=Engineer&remoteType=REMOTE');
      expect(res.status).toBe(200);
      expect(res.body.data.every((j) => j.remoteType === 'REMOTE')).toBe(true);
    });

    it('should save and unsave jobs to student bookmarks', async () => {
      // Save
      const saveRes = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/save`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(saveRes.status).toBe(200);
      expect(saveRes.body.isSaved).toBe(true);

      // Verify in saved jobs list
      const listRes = await request(app)
        .get('/api/v1/student/saved-jobs')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.some((j) => j._id === createdJobId.toString())).toBe(true);

      // Unsave
      const unsaveRes = await request(app)
        .delete(`/api/v1/jobs/${createdJobId}/save`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(unsaveRes.status).toBe(200);
      expect(unsaveRes.body.isSaved).toBe(false);
    });

    it('should allow reporting a job listing with a valid reason', async () => {
      const reportRes = await request(app)
        .post(`/api/v1/jobs/${createdJobId}/report`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          reason: 'MISLEADING',
          description: 'Job description specifies different requirements than title.',
        });
      expect(reportRes.status).toBe(200);
      expect(reportRes.body.success).toBe(true);
    });
  });

  // ================= 4. RESUME BUILDER & AUDIT =================
  describe('Resume Builder & Versioning', () => {
    it('should create a new technical resume', async () => {
      const res = await request(app)
        .post('/api/v1/student/resumes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Full Stack Engineer Resume',
          template: 'MODERN',
          personalInfo: {
            fullName: 'Jane Developer',
            email: 'jane@example.com',
            phone: '+1 555-0199',
            location: 'Remote, US',
          },
          summary: 'Software developer with strong expertise in React, Node.js, and MongoDB building distributed web apps.',
          skills: [
            { name: 'JavaScript', level: 'Advanced', category: 'Language' },
            { name: 'React', level: 'Advanced', category: 'Frontend' },
            { name: 'Node.js', level: 'Intermediate', category: 'Backend' },
          ],
          projects: [
            {
              title: 'Realtime Collaboration Platform',
              description: 'Built document editing with real-time websocket sync.',
              technologies: ['React', 'Node.js', 'Socket.io'],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe(1);
      createdResumeId = res.body.data._id;
    });

    it('should update resume, archive previous version, and increment version number', async () => {
      const res = await request(app)
        .patch(`/api/v1/student/resumes/${createdResumeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Senior Full Stack Resume',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.versionHistory.length).toBe(1);
    });

    it('should analyze resume against career path keywords without false guarantees', async () => {
      const res = await request(app)
        .post(`/api/v1/student/resumes/${createdResumeId}/analyze`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetRole: 'Full Stack Developer', jobId: createdJobId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.keywordAnalysis).toBeDefined();
      expect(res.body.data.disclaimer).toContain('does not guarantee');
    });

    it('should prevent Student 2 from viewing or updating Student 1 resume (IDOR protection)', async () => {
      const res = await request(app)
        .get(`/api/v1/student/resumes/${createdResumeId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(404);
    });
  });

  // ================= 5. JOB APPLICATIONS & STATE MACHINE =================
  describe('Job Application Pipeline & Duplicate Protection', () => {
    it('should submit an application successfully', async () => {
      const res = await request(app)
        .post('/api/v1/student/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          jobId: createdJobId,
          resumeId: createdResumeId,
          notes: 'Follow up next Tuesday if no response received.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('APPLIED');
      expect(res.body.data.timeline.length).toBe(1);
      createdAppId = res.body.data._id;
    });

    it('should reject duplicate application to the same job (Section 117)', async () => {
      const res = await request(app)
        .post('/api/v1/student/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          jobId: createdJobId,
          resumeId: createdResumeId,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already recorded');
    });

    it('should list student applications with pipeline counts', async () => {
      const res = await request(app)
        .get('/api/v1/student/applications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.applications.length).toBeGreaterThan(0);
      expect(res.body.pipelineCounts.APPLIED).toBeGreaterThan(0);
    });

    it('should allow student to withdraw application', async () => {
      const res = await request(app)
        .patch(`/api/v1/student/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'WITHDRAWN', note: 'Accepted an offer elsewhere' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('WITHDRAWN');
      expect(res.body.data.timeline.length).toBe(2);
    });

    it('should reject arbitrary invalid status transition by student', async () => {
      const res = await request(app)
        .patch(`/api/v1/student/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'OFFER' });

      expect(res.status).toBe(400);
    });

    it('should protect application against IDOR from other students', async () => {
      const res = await request(app)
        .get(`/api/v1/student/applications/${createdAppId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
    });
  });

  // ================= 6. PORTFOLIO & PRIVACY =================
  describe('Portfolio Showcase & Privacy Rules', () => {
    let studentUsername;

    it('should retrieve or initialize student portfolio', async () => {
      const res = await request(app)
        .get('/api/v1/student/portfolio')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.username).toBeDefined();
      studentUsername = res.body.data.username;
    });

    it('should update portfolio projects and visibility to PUBLIC', async () => {
      const res = await request(app)
        .patch('/api/v1/student/portfolio')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          headline: 'Full Stack Engineer & Cloud Architect',
          visibility: 'PUBLIC',
          projects: [
            {
              title: 'LMS Platform',
              description: 'Real-time collaborative learning ecosystem',
              technologies: ['React', 'Node.js', 'MongoDB'],
              githubUrl: 'https://github.com/test/lms',
              liveUrl: 'https://lms.test.com',
              status: 'SHOWCASE',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.visibility).toBe('PUBLIC');
      expect(res.body.data.projects.length).toBe(1);
    });

    it('should allow public access to public portfolio via /portfolio/:username', async () => {
      const res = await request(app).get(`/api/v1/portfolio/${studentUsername}`);
      expect(res.status).toBe(200);
      expect(res.body.data.username).toBe(studentUsername);
      expect(res.body.data.projects.length).toBe(1);
    });

    it('should deny unauthorized public access when portfolio is marked PRIVATE', async () => {
      // Toggle to private
      await request(app)
        .patch('/api/v1/student/portfolio')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ visibility: 'PRIVATE' });

      // Unauthenticated / other user request
      const res = await request(app).get(`/api/v1/portfolio/${studentUsername}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('private');
    });
  });

  // ================= 7. INTERVIEW PRACTICE & AI SIMULATOR =================
  describe('Interview Question Bank & Mock Sessions', () => {
    let sessionId;

    it('should query question bank by category and difficulty', async () => {
      const res = await request(app).get('/api/v1/interview/questions?category=TECHNICAL');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].category).toBe('TECHNICAL');
    });

    it('should start a multi-question mock interview session', async () => {
      const res = await request(app)
        .post('/api/v1/interview/sessions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'Full Stack Developer',
          category: 'TECHNICAL',
          difficulty: 'INTERMEDIATE',
          questionCount: 2,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.questions.length).toBeGreaterThan(0);
      sessionId = res.body.data._id;
    });

    it('should submit an answer, score coverage, and receive feedback', async () => {
      const res = await request(app)
        .post(`/api/v1/interview/sessions/${sessionId}/answer`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionIndex: 0,
          answer: 'The event loop checks the call stack first. Microtask queue contains Promise callbacks which drain before the macrotask setTimeout runs.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.questions[0].score).toBeGreaterThan(0);
      expect(res.body.data.questions[0].feedback).toBeDefined();
    });
  });

  // ================= 8. CAREER AI ASSISTANT =================
  describe('Career AI Assistant', () => {
    it('should chat with Career AI and receive grounded guidance', async () => {
      const res = await request(app)
        .post('/api/v1/ai/career/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'What skills should I prioritize to become a Full Stack Developer?',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
    });

    it('should analyze resume alignment against a specific job listing', async () => {
      const res = await request(app)
        .post('/api/v1/ai/career/resume-analysis')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          resumeId: createdResumeId,
          jobId: createdJobId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.matchedSkills).toBeDefined();
      expect(res.body.data.safetyNotice).toContain('Never fabricate');
    });
  });

  // ================= 9. ADMIN CAREER & PLACEMENT ANALYTICS =================
  describe('Admin Career Management & Moderation', () => {
    it('should fetch platform placement analytics for Admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/career/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalJobs).toBeGreaterThan(0);
      expect(res.body.data.totalCompanies).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.topSkillsInDemand)).toBe(true);
    });

    it('should allow admin to moderate job status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/career/jobs/${createdJobId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
    });
  });
});
