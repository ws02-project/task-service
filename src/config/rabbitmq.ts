import amqp from 'amqplib';
import { config } from './index';
import logger from '../utils/logger';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    logger.info('🐰 Connecting to RabbitMQ...');

    // Connect to RabbitMQ
    connection = await amqp.connect(config.rabbitmq.url);
    logger.info('✅ Connected to RabbitMQ');

    // Create channel
    channel = await connection.createChannel();
    logger.info('✅ RabbitMQ channel created');

    // Declare exchange
    await channel.assertExchange(config.rabbitmq.exchange, 'topic', {
      durable: true,
    });
    logger.info(`✅ Exchange '${config.rabbitmq.exchange}' declared`);

    // Declare Dead Letter Queue (DLQ) first
    const dlqName = config.rabbitmq.queues.taskEventsDLQ;
    await channel.assertQueue(dlqName, {
      durable: true,
      arguments: {
        'x-message-ttl': 604800000, // 7 days in milliseconds
      },
    });
    await channel.bindQueue(dlqName, config.rabbitmq.exchange, `${dlqName}.#`);
    logger.info(`✅ Dead Letter Queue '${dlqName}' created and bound`);

    // Declare main queue with DLQ configured
    const mainQueueName = config.rabbitmq.queues.taskEvents;
    await channel.assertQueue(mainQueueName, {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
        'x-dead-letter-exchange': config.rabbitmq.exchange,
        'x-dead-letter-routing-key': dlqName,
        'x-max-length': 10000, // Max 10k messages
      },
    });
    await channel.bindQueue(mainQueueName, config.rabbitmq.exchange, 'task.*');
    logger.info(`✅ Main queue '${mainQueueName}' created with DLQ configuration`);

    // Handle connection errors
    connection.on('error', (err) => {
      logger.error('RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

export const publishMessage = async (routingKey: string, message: object): Promise<void> => {
  try {
    const ch = getChannel();
    const messageBuffer = Buffer.from(JSON.stringify(message));

    ch.publish(config.rabbitmq.exchange, routingKey, messageBuffer, {
      persistent: true,
      timestamp: Date.now(),
    });

    logger.info(`📤 Message published with routing key '${routingKey}'`);
  } catch (error) {
    logger.error(`Failed to publish message with routing key '${routingKey}':`, error);
    throw error;
  }
};

export const closeRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
      logger.info('RabbitMQ channel closed');
    }
    if (connection) {
      await connection.close();
      logger.info('RabbitMQ connection closed');
    }
  } catch (error) {
    logger.error('Error closing RabbitMQ connection:', error);
  }
};
