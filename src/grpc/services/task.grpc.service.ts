import * as grpc from '@grpc/grpc-js';
import {
  getTasksByProjectId,
  getTaskStatisticsByProjectId,
  deleteTasksByProjectId,
} from '../../services/task.service';
import logger from '../../utils/logger';

/**
 * gRPC Service Implementation for TaskService
 */

/**
 * Get all tasks for a project
 */
export const getTasksByProject = async (call: any, callback: any) => {
  try {
    const { project_id } = call.request;

    if (!project_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'project_id is required',
      });
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
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
      })),
      total: tasks.length,
    });
  } catch (error) {
    logger.error('gRPC GetTasksByProject error:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to fetch tasks',
    });
  }
};

/**
 * Get task statistics for a project
 */
export const getTaskStatistics = async (call: any, callback: any) => {
  try {
    const { project_id } = call.request;

    if (!project_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'project_id is required',
      });
    }

    const stats = await getTaskStatisticsByProjectId(project_id);

    callback(null, {
      project_id: stats.projectId,
      total: stats.total,
      by_status: {
        pending: stats.byStatus.pending,
        in_progress: stats.byStatus.inProgress,
        completed: stats.byStatus.completed,
        cancelled: stats.byStatus.cancelled,
      },
      completion_rate: stats.completionRate,
    });
  } catch (error) {
    logger.error('gRPC GetTaskStatistics error:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to fetch task statistics',
    });
  }
};

/**
 * Delete all tasks for a project
 */
export const deleteTasksByProject = async (call: any, callback: any) => {
  try {
    const { project_id, confirm } = call.request;

    if (!project_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'project_id is required',
      });
    }

    if (!confirm) {
      return callback({
        code: grpc.status.FAILED_PRECONDITION,
        message: 'confirm flag must be true to delete tasks',
      });
    }

    const deletedCount = await deleteTasksByProjectId(project_id);

    callback(null, {
      success: true,
      deleted_count: deletedCount,
      message: `Successfully deleted ${deletedCount} task(s)`,
    });
  } catch (error) {
    logger.error('gRPC DeleteTasksByProject error:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to delete tasks',
    });
  }
};

/**
 * Count tasks for a project
 */
export const countTasksByProject = async (call: any, callback: any) => {
  try {
    const { project_id } = call.request;

    if (!project_id) {
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        message: 'project_id is required',
      });
    }

    const tasks = await getTasksByProjectId(project_id);

    callback(null, {
      project_id,
      count: tasks.length,
    });
  } catch (error) {
    logger.error('gRPC CountTasksByProject error:', error);
    callback({
      code: grpc.status.INTERNAL,
      message: 'Failed to count tasks',
    });
  }
};
