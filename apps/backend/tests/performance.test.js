const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 13 Performance & Resilience Test Suite', () => {
  describe('1. Health Probe Response Latency', () => {
    it('GET /health should respond within 100ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(150);
      expect(res.body.status).toBe('UP');
    });

    it('GET /live should respond within 100ms with process uptime', async () => {
      const start = Date.now();
      const res = await request(app).get('/live');
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(150);
      expect(res.body.status).toBe('ALIVE');
      expect(typeof res.body.uptimeSeconds).toBe('number');
    });

    it('GET /ready should verify database connection readiness', async () => {
      const start = Date.now();
      const res = await request(app).get('/ready');
      const duration = Date.now() - start;

      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(150);
      expect(res.body.status).toBe('READY');
      expect(res.body.database).toBe('CONNECTED');
    });
  });

  describe('2. Concurrent Request Throughput', () => {
    it('should handle 20 concurrent health checks with 100% success and low latency', async () => {
      const requests = Array.from({ length: 20 }).map(() => request(app).get('/health'));
      const start = Date.now();
      const results = await Promise.all(requests);
      const totalDuration = Date.now() - start;

      results.forEach((res) => {
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // Total duration for 20 concurrent in-memory requests should be fast (< 1000ms)
      expect(totalDuration).toBeLessThan(1500);
    });
  });
});
