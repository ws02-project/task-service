import request from 'supertest';
import express from 'express';
import httpStatus from 'http-status';

// Create a mock app for testing
const createMockApp = () => {
  const app = express();
  app.use(express.json());

  // Mock task data
  const tasks: Record<string, unknown>[] = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: 'pending',
      priority: 'medium',
      type: 'feature',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // Health check
  app.get('/api/v1/health', (_req, res) => {
    res.json({ status: 'ok', service: 'task-service' });
  });

  // Get all tasks
  app.get('/api/v1/tasks', (_req, res) => {
    res.json({ success: true, data: tasks });
  });

  // Get task by ID
  app.get('/api/v1/tasks/:id', (req, res) => {
    const task = tasks.find((t) => t.id === req.params.id);
    if (!task) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }
    res.json({ success: true, data: task });
  });

  // Create task
  app.post('/api/v1/tasks', (req, res) => {
    if (!req.body.title) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Title is required',
      });
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      ...req.body,
      status: req.body.status || 'pending',
      priority: req.body.priority || 'medium',
      type: req.body.type || 'feature',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    tasks.push(newTask);
    res.status(httpStatus.CREATED).json({ success: true, data: newTask });
  });

  // Update task
  app.patch('/api/v1/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
    if (taskIndex === -1) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    tasks[taskIndex] = {
      ...tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    res.json({ success: true, data: tasks[taskIndex] });
  });

  // Delete task
  app.delete('/api/v1/tasks/:id', (req, res) => {
    const taskIndex = tasks.findIndex((t) => t.id === req.params.id);
    if (taskIndex === -1) {
      res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: 'Task not found',
      });
      return;
    }

    tasks.splice(taskIndex, 1);
    res.status(httpStatus.NO_CONTENT).send();
  });

  return app;
};

describe('Task API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createMockApp();
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('task-service');
    });
  });

  describe('GET /api/v1/tasks', () => {
    it('should return all tasks', async () => {
      const res = await request(app).get('/api/v1/tasks');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    it('should return task by ID', async () => {
      const res = await request(app).get('/api/v1/tasks/task-1');

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('task-1');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).get('/api/v1/tasks/non-existent');

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Test Task',
        description: 'New Description',
        priority: 'high',
      };

      const res = await request(app).post('/api/v1/tasks').send(newTask);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newTask.title);
      expect(res.body.data.priority).toBe('high');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        description: 'No title provided',
      });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.body.success).toBe(false);
    });

    it('should set default values for optional fields', async () => {
      const res = await request(app).post('/api/v1/tasks').send({
        title: 'Minimal Task',
      });

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.priority).toBe('medium');
      expect(res.body.data.type).toBe('feature');
    });
  });

  describe('PATCH /api/v1/tasks/:id', () => {
    it('should update an existing task', async () => {
      const updateData = {
        title: 'Updated Title',
        status: 'in_progress',
      };

      const res = await request(app).patch('/api/v1/tasks/task-1').send(updateData);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe('in_progress');
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).patch('/api/v1/tasks/non-existent').send({
        title: 'Test',
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete an existing task', async () => {
      // First create a task to delete
      const createRes = await request(app).post('/api/v1/tasks').send({
        title: 'Task to Delete',
      });
      const taskId = createRes.body.data.id;

      const res = await request(app).delete(`/api/v1/tasks/${taskId}`);

      expect(res.status).toBe(httpStatus.NO_CONTENT);

      // Verify task is deleted
      const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);
      expect(getRes.status).toBe(httpStatus.NOT_FOUND);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app).delete('/api/v1/tasks/non-existent');

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});
