const request = require('supertest');
const app = require('../src/app');

describe('Health API', () => {
  it('GET /api/v1/health should return 200 and status message', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({
      success: true,
      message: 'API is running',
    });
  });

  it('GET /api/v1/nonexistent should return 404', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('NOT_FOUND');
  });
});
