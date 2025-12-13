import Joi from 'joi';
import {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  deleteTaskSchema,
} from '../../../validations/task.validation';

describe('Task Validation Schemas', () => {
  describe('createTaskSchema', () => {
    const validateCreate = (data: unknown) => {
      return Joi.compile(createTaskSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate({ body: data });
    };

    it('should pass with valid required fields', () => {
      const { error } = validateCreate({
        title: 'Test Task',
        description: 'Test Description',
      });
      expect(error).toBeUndefined();
    });

    it('should pass with all optional fields', () => {
      const { error } = validateCreate({
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        type: 'bug',
        projectId: '550e8400-e29b-41d4-a716-446655440000',
        assignedTo: 'user-123',
      });
      expect(error).toBeUndefined();
    });

    it('should fail without title', () => {
      const { error } = validateCreate({
        description: 'Test Description',
      });
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('title');
    });

    it('should fail without description', () => {
      const { error } = validateCreate({
        title: 'Test Task',
      });
      expect(error).toBeDefined();
      expect(error!.details[0].path).toContain('description');
    });

    it('should fail with empty title', () => {
      const { error } = validateCreate({
        title: '',
        description: 'Test Description',
      });
      expect(error).toBeDefined();
    });

    it('should fail with title too long', () => {
      const { error } = validateCreate({
        title: 'a'.repeat(256),
        description: 'Test Description',
      });
      expect(error).toBeDefined();
    });

    it('should fail with invalid status', () => {
      const { error } = validateCreate({
        title: 'Test Task',
        description: 'Test Description',
        status: 'invalid_status',
      });
      expect(error).toBeDefined();
    });

    it('should fail with invalid priority', () => {
      const { error } = validateCreate({
        title: 'Test Task',
        description: 'Test Description',
        priority: 'super_high',
      });
      expect(error).toBeDefined();
    });

    it('should fail with invalid projectId (not UUID)', () => {
      const { error } = validateCreate({
        title: 'Test Task',
        description: 'Test Description',
        projectId: 'not-a-uuid',
      });
      expect(error).toBeDefined();
    });
  });

  describe('updateTaskSchema', () => {
    const validateUpdate = (data: unknown, params: unknown) => {
      return Joi.compile(updateTaskSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate({ body: data, params });
    };

    it('should pass with valid update data', () => {
      const { error } = validateUpdate(
        { title: 'Updated Title' },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
      );
      expect(error).toBeUndefined();
    });

    it('should pass with status update', () => {
      const { error } = validateUpdate(
        { status: 'completed' },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
      );
      expect(error).toBeUndefined();
    });

    it('should fail with empty body', () => {
      const { error } = validateUpdate({}, { id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(error).toBeDefined();
    });

    it('should fail with invalid UUID in params', () => {
      const { error } = validateUpdate({ title: 'Updated' }, { id: 'invalid-uuid' });
      expect(error).toBeDefined();
    });

    it('should allow null assignedTo for unassigning', () => {
      const { error } = validateUpdate(
        { assignedTo: null },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
      );
      expect(error).toBeUndefined();
    });

    it('should allow empty string assignedTo for unassigning', () => {
      const { error } = validateUpdate(
        { assignedTo: '' },
        { id: '550e8400-e29b-41d4-a716-446655440000' },
      );
      expect(error).toBeUndefined();
    });
  });

  describe('getTaskSchema', () => {
    const validateGet = (params: unknown) => {
      return Joi.compile(getTaskSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate({ params });
    };

    it('should pass with valid UUID', () => {
      const { error } = validateGet({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid UUID', () => {
      const { error } = validateGet({ id: 'not-a-uuid' });
      expect(error).toBeDefined();
    });

    it('should fail without id', () => {
      const { error } = validateGet({});
      expect(error).toBeDefined();
    });
  });

  describe('deleteTaskSchema', () => {
    const validateDelete = (params: unknown) => {
      return Joi.compile(deleteTaskSchema)
        .prefs({ errors: { label: 'key' }, abortEarly: false })
        .validate({ params });
    };

    it('should pass with valid UUID', () => {
      const { error } = validateDelete({ id: '550e8400-e29b-41d4-a716-446655440000' });
      expect(error).toBeUndefined();
    });

    it('should fail with invalid UUID', () => {
      const { error } = validateDelete({ id: 'invalid' });
      expect(error).toBeDefined();
    });
  });
});
