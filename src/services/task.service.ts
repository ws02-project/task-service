import { Repository } from 'typeorm';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus, TaskPriority } from '../models/task.model';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { AppDataSource } from '../config/database';

class TaskService {
  private taskRepository: Repository<Task>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
  }

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return await this.taskRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }

    return task;
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { status },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Get tasks by priority
   */
  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    return await this.taskRepository.find({
      where: { priority },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const task = this.taskRepository.create({
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || TaskStatus.PENDING,
      priority: taskData.priority || TaskPriority.MEDIUM,
    });

    return await this.taskRepository.save(task);
  }

  /**
   * Update a task
   */
  async updateTask(id: string, updateData: UpdateTaskDTO): Promise<Task> {
    const task = await this.getTaskById(id);

    // Merge update data with existing task
    Object.assign(task, updateData);

    return await this.taskRepository.save(task);
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const task = await this.getTaskById(id);
    await this.taskRepository.remove(task);
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics() {
    const [total, pending, inProgress, completed, cancelled] = await Promise.all([
      this.taskRepository.count(),
      this.taskRepository.count({ where: { status: TaskStatus.PENDING } }),
      this.taskRepository.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      this.taskRepository.count({ where: { status: TaskStatus.COMPLETED } }),
      this.taskRepository.count({ where: { status: TaskStatus.CANCELLED } }),
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
  }
}

export default new TaskService();
