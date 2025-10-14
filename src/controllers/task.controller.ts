import { Request, Response } from 'express';
import httpStatus from 'http-status';
import * as taskService from '../services/task.service';
import catchAsync from '../utils/catchAsync';

export const getAllTasks = catchAsync(async (_req: Request, res: Response) => {
  const tasks = await taskService.getAllTasks();
  res.status(httpStatus.OK).json({
    success: true,
    data: tasks,
  });
});

export const getTaskById = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    data: task,
  });
});

export const createTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    data: task,
  });
});

export const updateTask = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: task,
  });
});

export const deleteTask = catchAsync(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});
