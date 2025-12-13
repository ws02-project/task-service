import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../models/task.model';
import * as taskService from '../../services/task.service';
import { AppDataSource } from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../messaging', () => ({
  publishTaskAssigned: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Task Service', () => {
  let mockRepository: jest.Mocked<Repository<Task>>;

  const mockTask: Task = {
    id: 'test-uuid-1234',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    type: TaskType.FEATURE,
    projectId: 'project-123',
    assignedTo: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<Repository<Task>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(mockRepository);
  });

  describe('getAllTasks', () => {
    it('should return all tasks ordered by createdAt DESC', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'test-uuid-5678' }];
      mockRepository.find.mockResolvedValue(tasks);

      const result = await taskService.getAllTasks();

      expect(result).toEqual(tasks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no tasks exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await taskService.getAllTasks();

      expect(result).toEqual([]);
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);

      const result = await taskService.getTaskById('test-uuid-1234');

      expect(result).toEqual(mockTask);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-1234' },
      });
    });

    it('should throw error when task not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(taskService.getTaskById('non-existent')).rejects.toThrow();
    });
  });

  describe('createTask', () => {
    it('should create task with default values', async () => {
      const createData = {
        title: 'New Task',
        description: 'New Description',
      };

      mockRepository.create.mockReturnValue(mockTask);
      mockRepository.save.mockResolvedValue(mockTask);

      const result = await taskService.createTask(createData);

      expect(result).toEqual(mockTask);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createData.title,
          description: createData.description,
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          type: TaskType.FEATURE,
        }),
      );
    });

    it('should create task with custom status and priority', async () => {
      const createData = {
        title: 'Urgent Task',
        description: 'Urgent Description',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        type: TaskType.BUG,
      };

      const customTask = { ...mockTask, ...createData };
      mockRepository.create.mockReturnValue(customTask);
      mockRepository.save.mockResolvedValue(customTask);

      const result = await taskService.createTask(createData);

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.priority).toBe(TaskPriority.HIGH);
      expect(result.type).toBe(TaskType.BUG);
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedTask = { ...mockTask, title: 'Updated Title' };

      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.save.mockResolvedValue(updatedTask);

      const result = await taskService.updateTask('test-uuid-1234', updateData);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw error when updating non-existent task', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(taskService.updateTask('non-existent', { title: 'Test' })).rejects.toThrow();
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockTask);
      mockRepository.remove.mockResolvedValue(mockTask);

      await expect(taskService.deleteTask('test-uuid-1234')).resolves.not.toThrow();
      expect(mockRepository.remove).toHaveBeenCalledWith(mockTask);
    });

    it('should throw error when deleting non-existent task', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(taskService.deleteTask('non-existent')).rejects.toThrow();
    });
  });

  describe('getTasksByStatus', () => {
    it('should return tasks filtered by status', async () => {
      const pendingTasks = [mockTask];
      mockRepository.find.mockResolvedValue(pendingTasks);

      const result = await taskService.getTasksByStatus(TaskStatus.PENDING);

      expect(result).toEqual(pendingTasks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: TaskStatus.PENDING },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTaskStatistics', () => {
    it('should return correct statistics', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(4) // in_progress
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(1); // cancelled

      const result = await taskService.getTaskStatistics();

      expect(result).toEqual({
        total: 10,
        byStatus: {
          pending: 3,
          inProgress: 4,
          completed: 2,
          cancelled: 1,
        },
      });
    });
  });
});
