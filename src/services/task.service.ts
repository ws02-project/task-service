import { Repository } from 'typeorm';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus, TaskPriority } from '../models/task.model';
import createApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { AppDataSource } from '../config/database';

// Helper to get repository
const getTaskRepository = (): Repository<Task> => AppDataSource.getRepository(Task);

/**
 * Get all tasks
 */
export const getAllTasks = async (): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    order: {
      createdAt: 'DESC',
    },
  });
};

/**
 * Get task by ID
 */
export const getTaskById = async (id: string): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = await taskRepository.findOne({
    where: { id },
  });

  if (!task) {
    throw createApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  return task;
};

/**
 * Get tasks by status
 */
export const getTasksByStatus = async (status: TaskStatus): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { status },
    order: {
      createdAt: 'DESC',
    },
  });
};

/**
 * Get tasks by priority
 */
export const getTasksByPriority = async (priority: TaskPriority): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { priority },
    order: {
      createdAt: 'DESC',
    },
  });
};

/**
 * Create a new task
 */
export const createTask = async (taskData: CreateTaskDTO): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = taskRepository.create({
    title: taskData.title,
    description: taskData.description,
    status: taskData.status || TaskStatus.PENDING,
    priority: taskData.priority || TaskPriority.MEDIUM,
    projectId: taskData.projectId,
  });

  return await taskRepository.save(task);
};

/**
 * Update a task
 */
export const updateTask = async (id: string, updateData: UpdateTaskDTO): Promise<Task> => {
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);

  // Merge update data with existing task
  Object.assign(task, updateData);

  return await taskRepository.save(task);
};

/**
 * Delete a task
 */
export const deleteTask = async (id: string): Promise<void> => {
  const taskRepository = getTaskRepository();
  const task = await getTaskById(id);
  await taskRepository.remove(task);
};

/**
 * Get task statistics
 */
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
    byStatus: {
      pending,
      inProgress,
      completed,
      cancelled,
    },
  };
};

/**
 * Get tasks by project ID
 */
export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
  const taskRepository = getTaskRepository();
  return await taskRepository.find({
    where: { projectId },
    order: {
      createdAt: 'DESC',
    },
  });
};

/**
 * Get task statistics by project ID
 */
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
    byStatus: {
      pending,
      inProgress,
      completed,
      cancelled,
    },
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : '0.00',
  };
};

/**
 * Delete all tasks by project ID
 */
export const deleteTasksByProjectId = async (projectId: string): Promise<number> => {
  const taskRepository = getTaskRepository();
  const tasks = await getTasksByProjectId(projectId);

  if (tasks.length === 0) {
    return 0;
  }

  await taskRepository.remove(tasks);
  return tasks.length;
};
