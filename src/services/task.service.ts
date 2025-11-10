import { Repository } from 'typeorm';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus, TaskPriority } from '../models/task.model';
import createApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { AppDataSource } from '../config/database';
import * as grpc from '@grpc/grpc-js';
import logger from '../utils/logger';
import { publishTaskAssigned } from '../messaging';

const getTaskRepository = (): Repository<Task> => AppDataSource.getRepository(Task);

export const getAllTasks = async (): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    order: { createdAt: 'DESC' },
  });
};

export const getTaskById = async (id: string): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = await taskRepository.findOne({ where: { id } });

  if (!task) {
    throw createApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  return task;
};

export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { status },
    order: { createdAt: 'DESC' },
  });
};

export const getTasksByPriority = async (priority: TaskPriority): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { priority },
    order: { createdAt: 'DESC' },
  });
};

export const createTask = async (taskData: CreateTaskDTO): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = taskRepository.create({
    title: taskData.title,
    description: taskData.description,
    status: taskData.status || TaskStatus.PENDING,
    priority: taskData.priority || TaskPriority.MEDIUM,
    projectId: taskData.projectId,
    assignedTo: taskData.assignedTo,
  });

  const savedTask = await taskRepository.save(task);

  // Publish task assigned event if assignedTo is provided
  if (savedTask.assignedTo && savedTask.projectId) {
    try {
      await publishTaskAssigned(
        savedTask.id,
        savedTask.projectId,
        savedTask.assignedTo,
        undefined, // assignedBy - could be extracted from request context in the future
        savedTask.title,
        savedTask.description || undefined,
      );
      logger.info(`📤 Published task.assigned event for task ${savedTask.id}`);
    } catch (error) {
      logger.error('Failed to publish task assigned event:', error);
      // Don't fail the task creation if event publishing fails
    }
  }

  return savedTask;
};

export const updateTask = async (id: string, updateData: UpdateTaskDTO): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);

  // Check if assignment is changing
  const wasAssigned = task.assignedTo;
  const isBeingAssigned = updateData.assignedTo && updateData.assignedTo !== task.assignedTo;
  const isBeingUnassigned = updateData.assignedTo === null || updateData.assignedTo === '';

  Object.assign(task, updateData);
  const savedTask = await taskRepository.save(task);

  // Publish task assigned event if:
  // 1. Task is being newly assigned (wasn't assigned before, now is)
  // 2. Task assignment is changing to a different user
  if (isBeingAssigned && savedTask.projectId && savedTask.assignedTo) {
    try {
      await publishTaskAssigned(
        savedTask.id,
        savedTask.projectId,
        savedTask.assignedTo,
        undefined, // assignedBy - could be extracted from request context in the future
        savedTask.title,
        savedTask.description || undefined,
      );
      logger.info(
        `📤 Published task.assigned event for task ${savedTask.id} (assigned to ${savedTask.assignedTo})`,
      );
    } catch (error) {
      logger.error('Failed to publish task assigned event:', error);
      // Don't fail the task update if event publishing fails
    }
  } else if (isBeingUnassigned && wasAssigned) {
    logger.info(`📝 Task ${savedTask.id} unassigned (was assigned to ${wasAssigned})`);
  }

  return savedTask;
};

export const deleteTask = async (id: string): Promise<void> => {
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);
  await taskRepository.remove(task);
};

export const getTaskStatistics = async () => {
  const taskRepository = getTaskRepository();
  const [total, pending, inProgress, completed, cancelled] = await Promise.all([
    taskRepository.count(),
    taskRepository.count({ where: { status: TaskStatus.PENDING } }),
    taskRepository.count({ where: { status: TaskStatus.IN_PROGRESS } }),
    taskRepository.count({ where: { status: TaskStatus.COMPLETED } }),
    taskRepository.count({ where: { status: TaskStatus.CANCELLED } }),
  ]);

  return {
    total,
    byStatus: { pending, inProgress, completed, cancelled },
  };
};

export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { projectId },
    order: { createdAt: 'DESC' },
  });
};

export const getTaskStatisticsByProjectId = async (projectId: string) => {
  const taskRepository = getTaskRepository();
  const [total, pending, inProgress, completed, cancelled] = await Promise.all([
    taskRepository.count({ where: { projectId } }),
    taskRepository.count({ where: { projectId, status: TaskStatus.PENDING } }),
    taskRepository.count({ where: { projectId, status: TaskStatus.IN_PROGRESS } }),
    taskRepository.count({ where: { projectId, status: TaskStatus.COMPLETED } }),
    taskRepository.count({ where: { projectId, status: TaskStatus.CANCELLED } }),
  ]);

  return {
    projectId,
    total,
    byStatus: { pending, inProgress, completed, cancelled },
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00',
  };
};

export const deleteTasksByProjectId = async (projectId: string): Promise<number> => {
  const taskRepository = getTaskRepository();
  const tasks = await getTasksByProjectId(projectId);

  if (tasks.length === 0) {
    return 0;
  }

  await taskRepository.remove(tasks);
  return tasks.length;
};

export const getTasksByProjectGrpc = async (
  call: { request: { project_id: string } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { project_id } = call.request;

    if (!project_id) {
      const error = new Error('project_id is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    const tasks = await getTasksByProjectId(project_id);

    callback(null, {
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        project_id: task.projectId || '',
        assigned_to: task.assignedTo || '',
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
      })),
      total: tasks.length,
    });
  } catch (error) {
    logger.error('gRPC GetTasksByProject error:', error);
    const grpcError = new Error('Failed to fetch tasks') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

export const deleteTasksByProjectGrpc = async (
  call: { request: { project_id: string; confirm: boolean } },
  callback: grpc.sendUnaryData<unknown>,
) => {
  try {
    const { project_id, confirm } = call.request;

    if (!project_id) {
      const error = new Error('project_id is required') as grpc.ServiceError;
      error.code = grpc.status.INVALID_ARGUMENT;
      return callback(error);
    }

    if (!confirm) {
      const error = new Error('confirm flag must be true to delete tasks') as grpc.ServiceError;
      error.code = grpc.status.FAILED_PRECONDITION;
      return callback(error);
    }

    const deletedCount = await deleteTasksByProjectId(project_id);

    callback(null, {
      success: true,
      deleted_count: deletedCount,
      message: `Successfully deleted ${deletedCount} task(s)`,
    });
  } catch (error) {
    logger.error('gRPC DeleteTasksByProject error:', error);
    const grpcError = new Error('Failed to delete tasks') as grpc.ServiceError;
    grpcError.code = grpc.status.INTERNAL;
    callback(grpcError);
  }
};

export const handleProjectCreated = async (event: Record<string, unknown>, _metadata: unknown) => {
  logger.info('🆕 Project created:', {
    projectId: event.projectId,
    name: event.name,
    status: event.status,
  });
};

export const handleProjectDeleted = async (event: Record<string, unknown>, _metadata: unknown) => {
  logger.info('🗑️ Project deleted:', {
    projectId: event.projectId,
  });
};
