import { Repository } from 'typeorm';
import { Task, CreateTaskDTO, UpdateTaskDTO } from '../models/task.model';
import createApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { AppDataSource } from '../config/database';
import { config } from '../config';
import * as projectGrpcClient from '../grpc/clients/project.grpc.client';
import logger from '../utils/logger';

// Helper to get repository
const getTaskRepository = (): Repository<Task> => AppDataSource.getRepository(Task);

/**
 * Create a new task with project validation
 */
export const createTaskWithValidation = async (
  taskData: CreateTaskDTO,
  userId?: string,
): Promise<Task> => {
  const taskRepository = getTaskRepository();

  // If projectId is provided, validate project access
  if (taskData.projectId) {
    try {
      // Check if project exists and can accept tasks
      const canAddResponse = await projectGrpcClient.canAddTasks(
        taskData.projectId,
        config.grpc.projectServiceUrl,
      );

      if (!canAddResponse.can_add) {
        throw createApiError(
          httpStatus.BAD_REQUEST,
          canAddResponse.message || 'Cannot add tasks to this project',
        );
      }

      // If userId is provided, validate user has access to project
      if (userId) {
        const accessResponse = await projectGrpcClient.validateProjectAccess(
          taskData.projectId,
          userId,
          config.grpc.projectServiceUrl,
        );

        if (!accessResponse.has_access) {
          throw createApiError(httpStatus.FORBIDDEN, 'You do not have access to this project');
        }
      }
    } catch (error: any) {
      // Handle gRPC errors
      if (error.code === 5) {
        // NOT_FOUND
        throw createApiError(httpStatus.NOT_FOUND, 'Project not found');
      }
      if (error.statusCode) {
        throw error; // Already an ApiError
      }
      logger.error('gRPC error during task creation:', error);
      throw createApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Project service is currently unavailable',
      );
    }
  }

  // Create the task
  const task = taskRepository.create(taskData);
  return await taskRepository.save(task);
};

/**
 * Get task with project details
 */
export const getTaskWithProject = async (id: string): Promise<any> => {
  const taskRepository = getTaskRepository();
  const task = await taskRepository.findOne({ where: { id } });

  if (!task) {
    throw createApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // If task has a project, fetch project details
  if (task.projectId) {
    try {
      const project = await projectGrpcClient.getProject(
        task.projectId,
        config.grpc.projectServiceUrl,
      );

      return {
        ...task,
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          owner: project.owner,
        },
      };
    } catch (error) {
      logger.warn(`Failed to fetch project ${task.projectId} for task ${id}:`, error);
      // Return task without project details if service is unavailable
      return task;
    }
  }

  return task;
};

/**
 * Update task with project validation
 */
export const updateTaskWithValidation = async (
  id: string,
  updateData: UpdateTaskDTO,
  userId?: string,
): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = await taskRepository.findOne({ where: { id } });

  if (!task) {
    throw createApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // If changing projectId, validate new project
  if (updateData.projectId && updateData.projectId !== task.projectId) {
    try {
      const canAddResponse = await projectGrpcClient.canAddTasks(
        updateData.projectId,
        config.grpc.projectServiceUrl,
      );

      if (!canAddResponse.can_add) {
        throw createApiError(
          httpStatus.BAD_REQUEST,
          canAddResponse.message || 'Cannot move task to this project',
        );
      }

      if (userId) {
        const accessResponse = await projectGrpcClient.validateProjectAccess(
          updateData.projectId,
          userId,
          config.grpc.projectServiceUrl,
        );

        if (!accessResponse.has_access) {
          throw createApiError(
            httpStatus.FORBIDDEN,
            'You do not have access to the target project',
          );
        }
      }
    } catch (error: any) {
      if (error.code === 5) {
        throw createApiError(httpStatus.NOT_FOUND, 'Project not found');
      }
      if (error.statusCode) {
        throw error;
      }
      logger.error('gRPC error during task update:', error);
      throw createApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Project service is currently unavailable',
      );
    }
  }

  // Merge update data with existing task
  Object.assign(task, updateData);
  return await taskRepository.save(task);
};
