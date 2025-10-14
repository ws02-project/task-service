import { Task, CreateTaskDTO, UpdateTaskDTO } from '../models/task.model';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

// In-memory storage (replace with database in production)
class TaskService {
  private tasks: Map<string, Task> = new Map();
  private idCounter = 1;

  /**
   * Get all tasks
   */
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
    }
    return task;
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const id = (this.idCounter++).toString();
    const now = new Date();

    const task: Task = {
      id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return task;
  }

  /**
   * Update a task
   */
  async updateTask(id: string, updateData: UpdateTaskDTO): Promise<Task> {
    const task = await this.getTaskById(id);

    const updatedTask: Task = {
      ...task,
      ...updateData,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    const task = await this.getTaskById(id);
    this.tasks.delete(task.id);
  }
}

export default new TaskService();
