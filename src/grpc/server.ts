import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import logger from '../utils/logger';
import { getTasksByProjectGrpc, deleteTasksByProjectGrpc } from '../services/task.service';

interface TaskProtoNamespace {
  TaskService: {
    service: grpc.ServiceDefinition;
  };
}

const PROTO_PATH = path.resolve(__dirname, '../../proto/task.proto');

export const startGrpcServer = (port: number = 50052): grpc.Server => {
  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const taskProto = grpc.loadPackageDefinition(packageDefinition)
    .task as unknown as TaskProtoNamespace;

  const server = new grpc.Server();

  server.addService(taskProto.TaskService.service, {
    GetTasksByProject: getTasksByProjectGrpc,
    DeleteTasksByProject: deleteTasksByProjectGrpc,
  });

  server.bindAsync(
    `0.0.0.0:${port}`,
    grpc.ServerCredentials.createInsecure(),
    (error, boundPort) => {
      if (error) {
        logger.error('Failed to start gRPC server:', error);
        throw error;
      }
      logger.info(`Task gRPC server running on port ${boundPort}`);
    },
  );

  return server;
};

/**
 * Gracefully shutdown gRPC server
 */
export const shutdownGrpcServer = (server: grpc.Server): Promise<void> => {
  return new Promise((resolve) => {
    server.tryShutdown(() => {
      logger.info('gRPC server shut down gracefully');
      resolve();
    });
  });
};
