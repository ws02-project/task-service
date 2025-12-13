import { Repository } from 'typeorm';
import {
  Task,
  CreateTaskDTO,
  UpdateTaskDTO,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../models/task.model';
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
  const startTime = Date.now();
  const taskRepository = getTaskRepository();
  const task = taskRepository.create({
    title: taskData.title,
    description: taskData.description,
    status: taskData.status || TaskStatus.PENDING,
    priority: taskData.priority || TaskPriority.MEDIUM,
    type: taskData.type || TaskType.FEATURE,
    projectId: taskData.projectId,
    assignedTo: taskData.assignedTo,
  });

  const savedTask = await taskRepository.save(task);

  logger.info('Task created', {
    type: 'task_created',
    taskId: savedTask.id,
    projectId: savedTask.projectId,
    status: savedTask.status,
    priority: savedTask.priority,
    taskType: savedTask.type,
    assignedTo: savedTask.assignedTo,
    duration: Date.now() - startTime,
  });

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
      logger.info('Event published - task.assigned', {
        type: 'event_published',
        eventType: 'task.assigned',
        taskId: savedTask.id,
        assignedTo: savedTask.assignedTo,
      });
    } catch (error) {
      logger.error('Failed to publish task.assigned event', {
        type: 'event_publish_failed',
        eventType: 'task.assigned',
        taskId: savedTask.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail the task creation if event publishing fails
    }
  }

  return savedTask;
};

export const updateTask = async (id: string, updateData: UpdateTaskDTO): Promise<Task> => {
  const startTime = Date.now();
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);

  // Track status change
  const oldStatus = task.status;
  const oldAssignee = task.assignedTo;

  // Check if assignment is changing
  const wasAssigned = task.assignedTo;
  const isBeingAssigned = updateData.assignedTo && updateData.assignedTo !== task.assignedTo;
  const isBeingUnassigned = updateData.assignedTo === null || updateData.assignedTo === '';

  Object.assign(task, updateData);
  const savedTask = await taskRepository.save(task);

  // Log status change
  if (updateData.status && updateData.status !== oldStatus) {
    logger.info('Task status changed', {
      type: 'task_status_changed',
      taskId: savedTask.id,
      projectId: savedTask.projectId,
      oldStatus,
      newStatus: savedTask.status,
    });
  }

  logger.info('Task updated', {
    type: 'task_updated',
    taskId: savedTask.id,
    projectId: savedTask.projectId,
    duration: Date.now() - startTime,
  });

  // Publish task assigned event if:
  // 1. Task is being newly assigned (wasn't assigned before, now is)
  // 2. Task assignment is changing to a different user
  if (isBeingAssigned && savedTask.projectId && savedTask.assignedTo) {
    logger.info('Task assigned', {
      type: 'task_assigned',
      taskId: savedTask.id,
      projectId: savedTask.projectId,
      assignedTo: savedTask.assignedTo,
      previousAssignee: oldAssignee,
    });
    try {
      await publishTaskAssigned(
        savedTask.id,
        savedTask.projectId,
        savedTask.assignedTo,
        undefined, // assignedBy - could be extracted from request context in the future
        savedTask.title,
        savedTask.description || undefined,
      );
      logger.info('Event published - task.assigned', {
        type: 'event_published',
        eventType: 'task.assigned',
        taskId: savedTask.id,
        assignedTo: savedTask.assignedTo,
      });
    } catch (error) {
      logger.error('Failed to publish task.assigned event', {
        type: 'event_publish_failed',
        eventType: 'task.assigned',
        taskId: savedTask.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't fail the task update if event publishing fails
    }
  } else if (isBeingUnassigned && wasAssigned) {
    logger.info('Task unassigned', {
      type: 'task_unassigned',
      taskId: savedTask.id,
      projectId: savedTask.projectId,
      previousAssignee: wasAssigned,
    });
  }

  return savedTask;
};

export const deleteTask = async (id: string): Promise<void> => {
  const startTime = Date.now();
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);

  await taskRepository.remove(task);

  logger.info('Task deleted', {
    type: 'task_deleted',
    taskId: id,
    projectId: task.projectId,
    duration: Date.now() - startTime,
  });
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
  logger.info('Event received - project.created', {
    type: 'event_received',
    eventType: 'project.created',
    projectId: event.projectId,
    projectName: event.name,
    projectStatus: event.status,
  });
};

export const handleProjectDeleted = async (event: Record<string, unknown>, _metadata: unknown) => {
  logger.info('Event received - project.deleted', {
    type: 'event_received',
    eventType: 'project.deleted',
    projectId: event.projectId,
  });
};
