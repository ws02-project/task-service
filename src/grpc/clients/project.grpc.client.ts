import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

const PROTO_PATH = path.resolve(__dirname, '../../../proto/project.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const projectProto = grpc.loadPackageDefinition(packageDefinition).project as any;

/**
 * Get Project gRPC Client
 * Connects to project-service gRPC server
 */
export const getProjectClient = (serverAddress: string = 'localhost:50051') => {
  return new projectProto.ProjectService(serverAddress, grpc.credentials.createInsecure());
};

/**
 * Get Project by ID
 */
export const getProject = (projectId: string, serverAddress?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProject({ project_id: projectId }, (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * Validate Project Access
 */
export const validateProjectAccess = (
  projectId: string,
  userId: string,
  serverAddress?: string,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.ValidateProjectAccess(
      { project_id: projectId, user_id: userId },
      (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
};

/**
 * Get Project Members
 */
export const getProjectMembers = (projectId: string, serverAddress?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProjectMembers({ project_id: projectId }, (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * Check if project can accept new tasks
 */
export const canAddTasks = (projectId: string, serverAddress?: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.CanAddTasks({ project_id: projectId }, (error: any, response: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};
