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

interface ProjectServiceClient {
  GetProject(
    request: { project_id: string },
    callback: (error: grpc.ServiceError | null, response: GetProjectResponse) => void,
  ): void;
  ValidateProjectAccess(
    request: { project_id: string; user_id: string },
    callback: (error: grpc.ServiceError | null, response: ValidateProjectAccessResponse) => void,
  ): void;
  GetProjectMembers(
    request: { project_id: string },
    callback: (error: grpc.ServiceError | null, response: GetProjectMembersResponse) => void,
  ): void;
  CanAddTasks(
    request: { project_id: string },
    callback: (error: grpc.ServiceError | null, response: CanAddTasksResponse) => void,
  ): void;
}

interface GetProjectResponse {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  members: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ValidateProjectAccessResponse {
  has_access: boolean;
  message: string;
}

interface GetProjectMembersResponse {
  project_id: string;
  owner: string;
  members: string[];
}

interface CanAddTasksResponse {
  can_add: boolean;
  message: string;
}

const projectProto = grpc.loadPackageDefinition(packageDefinition).project as unknown as {
  ProjectService: new (
    address: string,
    credentials: grpc.ChannelCredentials,
  ) => ProjectServiceClient;
};

export const getProjectClient = (
  serverAddress: string = 'localhost:50051',
): ProjectServiceClient => {
  return new projectProto.ProjectService(serverAddress, grpc.credentials.createInsecure());
};

export const getProject = (
  projectId: string,
  serverAddress?: string,
): Promise<GetProjectResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProject(
      { project_id: projectId },
      (error: grpc.ServiceError | null, response: GetProjectResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
};

export const validateProjectAccess = (
  projectId: string,
  userId: string,
  serverAddress?: string,
): Promise<ValidateProjectAccessResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.ValidateProjectAccess(
      { project_id: projectId, user_id: userId },
      (error: grpc.ServiceError | null, response: ValidateProjectAccessResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
};

export const getProjectMembers = (
  projectId: string,
  serverAddress?: string,
): Promise<GetProjectMembersResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.GetProjectMembers(
      { project_id: projectId },
      (error: grpc.ServiceError | null, response: GetProjectMembersResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
};

export const canAddTasks = (
  projectId: string,
  serverAddress?: string,
): Promise<CanAddTasksResponse> => {
  return new Promise((resolve, reject) => {
    const client = getProjectClient(serverAddress);
    client.CanAddTasks(
      { project_id: projectId },
      (error: grpc.ServiceError | null, response: CanAddTasksResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      },
    );
  });
};
