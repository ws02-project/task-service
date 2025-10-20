import { EventBus, ServiceRegistration } from './EventBus';
import { config } from '../config';
import logger from '../utils/logger';

// Create EventBus instance
export const eventBus = new EventBus('task-service', 'microservices.exchange');

/**
 * Initialize and register the task-service with the messaging system
 * This shows how to manually register a service with queues and subscriptions
 */
export async function initializeMessaging(): Promise<void> {
  try {
    // Initialize connection
    await eventBus.initialize(config.rabbitmq.url);

    // Load protobuf schemas (mounted volume in Docker)
    // Load both task and project protos to deserialize events from both services
    await eventBus.loadProtoSchema(['/app/proto/task.proto', '/app/proto/project.proto']);

    // Define service registration
    const registration: ServiceRegistration = {
      serviceName: 'task-service',

      // Define queues this service owns
      queues: [
        {
          name: 'task-service.events',
          durable: true,
          deadLetterQueue: 'task-service.dlq',
          ttl: 31536000000, // 1 year
          maxLength: 10000,
        },
      ],

      // Subscribe to events from other services
      subscriptions: [
        {
          eventType: 'project.created',
          routingKey: 'project.created',
          sourceService: 'project-service',
        },
        {
          eventType: 'project.updated',
          routingKey: 'project.updated',
          sourceService: 'project-service',
        },
        {
          eventType: 'project.deleted',
          routingKey: 'project.deleted',
          sourceService: 'project-service',
        },
        {
          eventType: 'project.archived',
          routingKey: 'project.archived',
          sourceService: 'project-service',
        },
      ],
    };

    // Register the service
    await eventBus.registerService(registration);

    // Register event handlers
    registerEventHandlers();

    // Start consuming
    await eventBus.startConsuming();

    logger.info('✅ Messaging system initialized for task-service');
  } catch (error) {
    logger.error('Failed to initialize messaging:', error);
    throw error;
  }
}

/**
 * Register handlers for events from other services
 */
function registerEventHandlers(): void {
  // Handle project created events
  eventBus.on('project.created', 'project.ProjectCreatedEvent', async (event, _metadata) => {
    logger.info(`🆕 Project created: ${event.projectId}`, {
      name: event.name,
      status: event.status,
    });
    // Perform any necessary initialization for the new project
  });

  // Handle project updated events
  eventBus.on('project.updated', 'project.ProjectUpdatedEvent', async (event, _metadata) => {
    logger.info(`📝 Project updated: ${event.projectId}`, {
      changes: event.changes,
    });
  });

  // Handle project deleted events
  eventBus.on('project.deleted', 'project.ProjectDeletedEvent', async (event, _metadata) => {
    logger.info(`🗑️ Project deleted: ${event.projectId}`);
    // Delete all tasks for this project
  });

  // Handle project archived events
  eventBus.on('project.archived', 'project.ProjectArchivedEvent', async (event, _metadata) => {
    logger.info(`📦 Project archived: ${event.projectId}`);
    // Archive or close all tasks for this project
  });
}

/**
 * Publish task created event
 */
export async function publishTaskCreated(
  taskId: string,
  data: {
    projectId: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assignedTo: string | null;
  },
): Promise<void> {
  await eventBus.publish('task.created', 'task.created', 'task.TaskCreatedEvent', {
    taskId,
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assignedTo: data.assignedTo || '',
    timestamp: Date.now(),
  });
}

/**
 * Publish task updated event
 */
export async function publishTaskUpdated(
  taskId: string,
  projectId: string,
  changes: Record<string, string>,
): Promise<void> {
  await eventBus.publish('task.updated', 'task.updated', 'task.TaskUpdatedEvent', {
    taskId,
    projectId,
    changes,
    timestamp: Date.now(),
  });
}

/**
 * Publish task deleted event
 */
export async function publishTaskDeleted(
  taskId: string,
  projectId: string,
  deletedBy: string,
): Promise<void> {
  await eventBus.publish('task.deleted', 'task.deleted', 'task.TaskDeletedEvent', {
    taskId,
    projectId,
    deletedBy,
    timestamp: Date.now(),
  });
}

/**
 * Publish task status changed event
 */
export async function publishTaskStatusChanged(
  taskId: string,
  projectId: string,
  oldStatus: string,
  newStatus: string,
): Promise<void> {
  await eventBus.publish(
    'task.status_changed',
    'task.status.changed',
    'task.TaskStatusChangedEvent',
    {
      taskId,
      projectId,
      oldStatus,
      newStatus,
      timestamp: Date.now(),
    },
  );
}

/**
 * Close messaging connections
 */
export async function closeMessaging(): Promise<void> {
  await eventBus.close();
}
