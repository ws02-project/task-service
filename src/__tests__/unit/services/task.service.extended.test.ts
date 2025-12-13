import { Repository } from 'typeorm';
import * as grpc from '@grpc/grpc-js';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../models/task.model';
import * as taskService from '../../../services/task.service';
import { AppDataSource } from '../../../config/database';
import logger from '../../../utils/logger';
import * as messaging from '../../../messaging';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../../messaging', () => ({
  publishTaskAssigned: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const mockedLogger = jest.mocked(logger);
const mockedMessaging = jest.mocked(messaging);

describe('Task Service - Extended Tests', () => {
  let mockRepository: jest.Mocked<Repository<Task>>;

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-uuid-1234',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    type: TaskType.FEATURE,
    projectId: 'project-123',
    assignedTo: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

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

  describe('getTasksByPriority', () => {
    it('should return tasks filtered by priority', async () => {
      const highPriorityTasks = [createMockTask({ priority: TaskPriority.HIGH })];
      mockRepository.find.mockResolvedValue(highPriorityTasks);

      const result = await taskService.getTasksByPriority(TaskPriority.HIGH);

      expect(result).toEqual(highPriorityTasks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { priority: TaskPriority.HIGH },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTasksByProjectId', () => {
    it('should return tasks for a project', async () => {
      const projectTasks = [createMockTask({ projectId: 'project-123' })];
      mockRepository.find.mockResolvedValue(projectTasks);

      const result = await taskService.getTasksByProjectId('project-123');

      expect(result).toEqual(projectTasks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getTaskStatisticsByProjectId', () => {
    it('should return statistics for a project', async () => {
      mockRepository.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3) // pending
        .mockResolvedValueOnce(4) // in_progress
        .mockResolvedValueOnce(2) // completed
        .mockResolvedValueOnce(1); // cancelled

      const result = await taskService.getTaskStatisticsByProjectId('project-123');

      expect(result).toEqual({
        projectId: 'project-123',
        total: 10,
        byStatus: {
          pending: 3,
          inProgress: 4,
          completed: 2,
          cancelled: 1,
        },
        completionRate: '20.00',
      });
    });

    it('should return 0% completion rate when no tasks', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await taskService.getTaskStatisticsByProjectId('project-123');

      expect(result.completionRate).toBe('0.00');
    });
  });

  describe('deleteTasksByProjectId', () => {
    it('should delete all tasks for a project', async () => {
      const projectTasks = [createMockTask({ id: 'task-1' }), createMockTask({ id: 'task-2' })];
      mockRepository.find.mockResolvedValue(projectTasks);
      mockRepository.remove.mockResolvedValue(projectTasks as unknown as Task);

      const result = await taskService.deleteTasksByProjectId('project-123');

      expect(result).toBe(2);
      expect(mockRepository.remove).toHaveBeenCalledWith(projectTasks);
    });

    it('should return 0 when no tasks to delete', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await taskService.deleteTasksByProjectId('project-123');

      expect(result).toBe(0);
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('gRPC handlers', () => {
    describe('getTasksByProjectGrpc', () => {
      it('should return tasks for a project', async () => {
        const tasks = [createMockTask()];
        mockRepository.find.mockResolvedValue(tasks);
        const callback = jest.fn();

        await taskService.getTasksByProjectGrpc(
          { request: { project_id: 'project-123' } },
          callback,
        );

        expect(callback).toHaveBeenCalledWith(
          null,
          expect.objectContaining({
            tasks: expect.any(Array),
            total: 1,
          }),
        );
      });

      it('should return error when project_id is missing', async () => {
        const callback = jest.fn();

        await taskService.getTasksByProjectGrpc({ request: { project_id: '' } }, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });

    describe('deleteTasksByProjectGrpc', () => {
      it('should delete tasks when confirmed', async () => {
        const tasks = [createMockTask()];
        mockRepository.find.mockResolvedValue(tasks);
        mockRepository.remove.mockResolvedValue(tasks as unknown as Task);
        const callback = jest.fn();

        await taskService.deleteTasksByProjectGrpc(
          { request: { project_id: 'project-123', confirm: true } },
          callback,
        );

        expect(callback).toHaveBeenCalledWith(
          null,
          expect.objectContaining({
            success: true,
            deleted_count: 1,
          }),
        );
      });

      it('should return error when not confirmed', async () => {
        const callback = jest.fn();

        await taskService.deleteTasksByProjectGrpc(
          { request: { project_id: 'project-123', confirm: false } },
          callback,
        );

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.FAILED_PRECONDITION }),
        );
      });

      it('should return error when project_id is missing', async () => {
        const callback = jest.fn();

        await taskService.deleteTasksByProjectGrpc(
          { request: { project_id: '', confirm: true } },
          callback,
        );

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ code: grpc.status.INVALID_ARGUMENT }),
        );
      });
    });
  });

  describe('Event handlers', () => {
    describe('handleProjectCreated', () => {
      it('should log project created event', async () => {
        const event = {
          projectId: 'project-123',
          name: 'New Project',
          status: 'active',
        };

        await taskService.handleProjectCreated(event, {});

        expect(mockedLogger.info).toHaveBeenCalledWith(
          'Event received - project.created',
          expect.objectContaining({
            type: 'event_received',
            eventType: 'project.created',
            projectId: 'project-123',
          }),
        );
      });
    });

    describe('handleProjectDeleted', () => {
      it('should log project deleted event', async () => {
        const event = { projectId: 'project-123' };

        await taskService.handleProjectDeleted(event, {});

        expect(mockedLogger.info).toHaveBeenCalledWith(
          'Event received - project.deleted',
          expect.objectContaining({
            type: 'event_received',
            eventType: 'project.deleted',
            projectId: 'project-123',
          }),
        );
      });
    });
  });

  describe('Task assignment and events', () => {
    it('should publish event when task is created with assignee', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Description',
        projectId: 'project-123',
        assignedTo: 'user-123',
      };
      const savedTask = createMockTask(taskData);

      mockRepository.create.mockReturnValue(savedTask);
      mockRepository.save.mockResolvedValue(savedTask);

      await taskService.createTask(taskData);

      expect(mockedMessaging.publishTaskAssigned).toHaveBeenCalledWith(
        savedTask.id,
        savedTask.projectId,
        savedTask.assignedTo,
        undefined,
        savedTask.title,
        savedTask.description,
      );
    });

    it('should not publish event when task is created without assignee', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Description',
      };
      const savedTask = createMockTask({
        ...taskData,
        assignedTo: undefined,
        projectId: undefined,
      });

      mockRepository.create.mockReturnValue(savedTask);
      mockRepository.save.mockResolvedValue(savedTask);

      await taskService.createTask(taskData);

      expect(mockedMessaging.publishTaskAssigned).not.toHaveBeenCalled();
    });

    it('should publish event when task assignment changes', async () => {
      const existingTask = createMockTask({ assignedTo: undefined });
      const updatedTask = createMockTask({ assignedTo: 'user-456' });

      mockRepository.findOne.mockResolvedValue(existingTask);
      mockRepository.save.mockResolvedValue(updatedTask);

      await taskService.updateTask('task-uuid-1234', { assignedTo: 'user-456' });

      expect(mockedMessaging.publishTaskAssigned).toHaveBeenCalled();
    });
  });
});
