const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const { User } = require('../src/models/user.model');
const { SupportTicket } = require('../src/models/supportTicket.model');
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

describe('Phase 14 Support Tickets & Helpdesk Test Suite', () => {
  let student1;
  let student1Token;
  let student2;
  let student2Token;

  beforeEach(async () => {
    student1 = await User.create({
      name: 'Ticket Student 1',
      email: `t_student1_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    student1Token = generateAccessToken(student1);

    student2 = await User.create({
      name: 'Ticket Student 2',
      email: `t_student2_${Date.now()}@example.com`,
      password: 'StrongPassword123!',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    student2Token = generateAccessToken(student2);
  });

  afterEach(async () => {
    await User.deleteMany({});
    await SupportTicket.deleteMany({});
  });

  describe('1. Support Ticket Creation & AI Classification', () => {
    it('should create ticket and classify category as TECHNICAL for error reports', async () => {
      const res = await request(app)
        .post('/api/v1/support/tickets')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          subject: 'Code sandbox crashed with timeout error',
          message: 'When running test cases on problem 3, the sandbox execution threw an error.',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.ticket.ticketId).toMatch(/^TCK-/);
      expect(res.body.ticket.category).toBe('TECHNICAL');
      expect(res.body.ticket.status).toBe('OPEN');
    });
  });

  describe('2. Message Threading & IDOR Protection', () => {
    it('should allow ticket owner to view their ticket and append a message', async () => {
      const ticket = await SupportTicket.create({
        ticketId: 'TCK-TEST001',
        studentId: student1._id,
        subject: 'Course video failing to stream',
        category: 'COURSE',
        priority: 'MEDIUM',
        status: 'OPEN',
        messages: [{ senderId: student1._id, senderRole: 'STUDENT', message: 'Video 2 is buffering' }],
      });

      // Student 1 can retrieve their ticket
      const getRes = await request(app)
        .get(`/api/v1/support/tickets/${ticket.ticketId}`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.ticket.subject).toBe('Course video failing to stream');

      // Student 1 can add a message
      const msgRes = await request(app)
        .post(`/api/v1/support/tickets/${ticket.ticketId}/messages`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ message: 'Still buffering today' });

      expect(msgRes.statusCode).toBe(200);
      expect(msgRes.body.ticket.messages.length).toBe(2);
    });

    it('should reject unauthorized student from accessing another student ticket (IDOR guard)', async () => {
      const ticket = await SupportTicket.create({
        ticketId: 'TCK-PRIVATE002',
        studentId: student1._id,
        subject: 'Confidential grade query',
        category: 'COURSE',
        priority: 'MEDIUM',
        status: 'OPEN',
        messages: [{ senderId: student1._id, senderRole: 'STUDENT', message: 'Private message' }],
      });

      // Student 2 attempts to access Student 1's ticket
      const res = await request(app)
        .get(`/api/v1/support/tickets/${ticket.ticketId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
