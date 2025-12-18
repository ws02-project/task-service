import Joi from 'joi';
import { TaskStatus, TaskPriority, TaskType } from '../models/task.model';

export const createTaskSchema = {
  body: Joi.object({
    title: Joi.string().required().min(1).max(255),
    description: Joi.string().required().min(1).max(5000),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    priority: Joi.string()
      .valid(...Object.values(TaskPriority))
      .optional(),
    type: Joi.string()
      .valid(...Object.values(TaskType))
      .optional(),
    projectId: Joi.string().uuid().optional(),
    assignedTo: Joi.string().uuid().optional(),
  }),
};

export const updateTaskSchema = {
  body: Joi.object({
    title: Joi.string().optional().min(1).max(255),
    description: Joi.string().optional().max(5000),
    status: Joi.string()
      .valid(...Object.values(TaskStatus))
      .optional(),
    priority: Joi.string()
      .valid(...Object.values(TaskPriority))
      .optional(),
    type: Joi.string()
      .valid(...Object.values(TaskType))
      .optional(),
    projectId: Joi.string().uuid().optional(),
    assignedTo: Joi.string().uuid().optional().allow(null, ''),
  }).min(1),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getTaskSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const deleteTaskSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

export const getTasksByAssigneeSchema = {
  params: Joi.object({
    userId: Joi.string().uuid().required(),
  }),
};
