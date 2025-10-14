import Joi from 'joi';

export const createTaskSchema = {
  body: Joi.object({
    title: Joi.string().required().min(1).max(200),
    description: Joi.string().optional().max(1000),
    status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  }),
};

export const updateTaskSchema = {
  body: Joi.object({
    title: Joi.string().optional().min(1).max(200),
    description: Joi.string().optional().max(1000),
    status: Joi.string().valid('pending', 'in-progress', 'completed').optional(),
  }).min(1),
  params: Joi.object({
    id: Joi.string().required(),
  }),
};

export const getTaskSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};

export const deleteTaskSchema = {
  params: Joi.object({
    id: Joi.string().required(),
  }),
};
