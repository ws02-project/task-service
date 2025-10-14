/**
 * gRPC Type Definitions for Task Service
 */

// Project Service gRPC Response Types
export interface ProjectResponse {
  id: string;
  name: string;
  status: string;
  owner: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ValidateProjectAccessResponse {
  has_access: boolean;
  role?: string;
  message?: string;
}

export interface ProjectMembersResponse {
  members: Array<{
    user_id: string;
    role: string;
    joined_at: string;
  }>;
}

export interface CanAddTasksResponse {
  can_add: boolean;
  message?: string;
  reason?: string;
}

// gRPC Error Type
export interface GrpcError extends Error {
  code?: number;
  details?: string;
  metadata?: unknown;
}
