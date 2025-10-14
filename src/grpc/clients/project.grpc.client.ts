import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import {
  ProjectResponse,
  ValidateProjectAccessResponse,
  ProjectMembersResponse,
  CanAddTasksResponse,
  GrpcError,
} from '../../types/grpc.types';

const PROTO_PATH = path.resolve(__dirname, '../../../proto/project.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

interface ProjectServiceClient extends grpc.Client {
  GetProject: (
    request: { project_id: string },
    callback: (error: GrpcError | null, response: ProjectResponse) => void,
  ) => void;
  ValidateProjectAccess: (
    request: { project_id: string; user_id: string },
    callback: (error: GrpcError | null, response: ValidateProjectAccessResponse) => void,
  ) => void;
  GetProjectMembers: (
    request: { project_id: string },
    callback: (error: GrpcError | null, response: ProjectMembersResponse) => void,
  ) => void;
  CanAddTasks: (
    request: { project_id: string },
    callback: (error: GrpcError | null, response: CanAddTasksResponse) => void,
  ) => void;
}

const projectProto = grpc.loadPackageDefinition(packageDefinition).project as unknown as {
  ProjectService: new (
    address: string,
    credentials: grpc.ChannelCredentials,
  ) => ProjectServiceClient;
};

/**
 * Get Project gRPC Client
 * Connects to project-service gRPC server
 */
export const getProjectClient = (serverAddress = 'localhost:50051'): ProjectServiceClient => {
  return new projectProto.ProjectService(serverAddress, grpc.credentials.createInsecure());
};

/**
 * Get Project by ID
 */
export const getProject = (projectId: string, serverAddress?: string): Promise<ProjectResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProject({ project_id: projectId }, (error, response) => {
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
): Promise<ValidateProjectAccessResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.ValidateProjectAccess({ project_id: projectId, user_id: userId }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};

/**
 * Get Project Members
 */
export const getProjectMembers = (
  projectId: string,
  serverAddress?: string,
): Promise<ProjectMembersResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProjectMembers({ project_id: projectId }, (error, response) => {
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
export const canAddTasks = (
  projectId: string,
  serverAddress?: string,
): Promise<CanAddTasksResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.CanAddTasks({ project_id: projectId }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
};
