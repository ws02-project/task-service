export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
}
