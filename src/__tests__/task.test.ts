import request from 'supertest';
import app from '../app';

describe('Task API Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'task-service');
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
      };

      const res = await request(app).post('/api/v1/tasks').send(taskData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe(taskData.title);
    });

    it('should fail with invalid task data', async () => {
      const res = await request(app).post('/api/v1/tasks').send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should return all tasks', async () => {
      const res = await request(app).get('/api/v1/tasks');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should return a task by id', async () => {
      // First create a task
      const createRes = await request(app).post('/api/v1/tasks').send({
        title: 'Test Task for GET',
        status: 'pending',
      });

      const taskId = createRes.body.data.id;

      // Then retrieve it
      const res = await request(app).get(`/api/v1/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(taskId);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/api/v1/tasks/999999');

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should update a task', async () => {
      // Create a task
      const createRes = await request(app).post('/api/v1/tasks').send({
        title: 'Original Title',
        status: 'pending',
      });

      const taskId = createRes.body.data.id;

      // Update it
      const updateData = {
        title: 'Updated Title',
        status: 'completed',
      };

      const res = await request(app).patch(`/api/v1/tasks/${taskId}`).send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updateData.title);
      expect(res.body.data.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete a task', async () => {
      // Create a task
      const createRes = await request(app).post('/api/v1/tasks').send({
        title: 'Task to Delete',
        status: 'pending',
      });

      const taskId = createRes.body.data.id;

      // Delete it
      const res = await request(app).delete(`/api/v1/tasks/${taskId}`);

      expect(res.status).toBe(204);

      // Verify it's deleted
      const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
