import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as taskController from '../../../controllers/task.controller';
import * as taskService from '../../../services/task.service';
import { Task, TaskStatus, TaskPriority, TaskType } from '../../../models/task.model';

// Mock the service layer
jest.mock('../../../services/task.service');

const mockedTaskService = taskService as jest.Mocked<typeof taskService>;

describe('Task Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  const mockTask: Task = {
    id: 'task-uuid-1234',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    type: TaskType.FEATURE,
    projectId: 'project-123',
    assignedTo: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      params: {},
      body: {},
      query: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('getAllTasks', () => {
    it('should return all tasks with 200 status', async () => {
      const tasks = [mockTask, { ...mockTask, id: 'task-uuid-5678' }];
      mockedTaskService.getAllTasks.mockResolvedValue(tasks);

      await taskController.getAllTasks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedTaskService.getAllTasks).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: tasks,
      });
    });

    it('should return empty array when no tasks exist', async () => {
      mockedTaskService.getAllTasks.mockResolvedValue([]);

      await taskController.getAllTasks(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });
  });

  describe('getTaskById', () => {
    it('should return task with 200 status', async () => {
      mockReq.params = { id: 'task-uuid-1234' };
      mockedTaskService.getTaskById.mockResolvedValue(mockTask);

      await taskController.getTaskById(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedTaskService.getTaskById).toHaveBeenCalledWith('task-uuid-1234');
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      });
    });
  });

  describe('createTask', () => {
    it('should create task and return 201 status', async () => {
      const createData = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
      };
      mockReq.body = createData;
      mockedTaskService.createTask.mockResolvedValue(mockTask);

      await taskController.createTask(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedTaskService.createTask).toHaveBeenCalledWith(createData);
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      });
    });
  });

  describe('updateTask', () => {
    it('should update task and return 200 status', async () => {
      const updateData = { title: 'Updated Title', status: TaskStatus.IN_PROGRESS };
      mockReq.params = { id: 'task-uuid-1234' };
      mockReq.body = updateData;
      const updatedTask = { ...mockTask, ...updateData };
      mockedTaskService.updateTask.mockResolvedValue(updatedTask);

      await taskController.updateTask(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedTaskService.updateTask).toHaveBeenCalledWith('task-uuid-1234', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: updatedTask,
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task and return 204 status', async () => {
      mockReq.params = { id: 'task-uuid-1234' };
      mockedTaskService.deleteTask.mockResolvedValue();

      await taskController.deleteTask(mockReq as Request, mockRes as Response, mockNext);

      expect(mockedTaskService.deleteTask).toHaveBeenCalledWith('task-uuid-1234');
      expect(mockRes.status).toHaveBeenCalledWith(httpStatus.NO_CONTENT);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });
});
