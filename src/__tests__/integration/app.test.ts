import request from 'supertest';
import app from '../../app';

// Mock the database
jest.mock('../../config/database', () => ({
  AppDataSource: {
    isInitialized: true,
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((data) => ({ id: 'test-uuid', ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      remove: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    }),
    initialize: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../messaging', () => ({
  publishTaskAssigned: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('Task Service App', () => {
  describe('Health Check', () => {
    it('GET /api/v1/health should return 200', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'task-service');
    });

    it('GET /healthz should return 404 (not configured)', async () => {
      const res = await request(app).get('/healthz');

      // This route is not configured in the app, so it returns 404
      expect(res.status).toBe(404);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/v1/unknown-route');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Not found');
    });
  });

  describe('Request Headers', () => {
    it('should have security headers (helmet)', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.headers).toHaveProperty('x-content-type-options');
      expect(res.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const res = await request(app)
        .options('/api/v1/tasks')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(204);
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON body', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .send({ title: 'Test', description: 'Test desc' })
        .set('Content-Type', 'application/json');

      // Should not fail on JSON parsing (may fail on validation or other reasons)
      expect(res.status).not.toBe(415); // Unsupported Media Type
    });
  });
});

describe('Task API Routes', () => {
  describe('GET /api/v1/tasks', () => {
    it('should return tasks array', async () => {
      const res = await request(app).get('/api/v1/tasks');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000');

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const res = await request(app).get('/api/v1/tasks/invalid-uuid');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should return 400 for missing required fields', async () => {
      const res = await request(app).post('/api/v1/tasks').send({});

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        description: 'Test description',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing description', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        title: 'Test title',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        title: 'Test',
        description: 'Test desc',
        status: 'invalid_status',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid priority', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        title: 'Test',
        description: 'Test desc',
        priority: 'invalid_priority',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should return 400 for invalid UUID', async () => {
      const res = await request(app).patch('/api/v1/tasks/invalid-uuid').send({
        title: 'Updated',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 for empty body', async () => {
      const res = await request(app)
        .patch('/api/v1/tasks/550e8400-e29b-41d4-a716-446655440000')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should return 400 for invalid UUID', async () => {
      const res = await request(app).delete('/api/v1/tasks/invalid-uuid');

      expect(res.status).toBe(400);
    });
  });
});
