import { Request, Response, RequestHandler } from 'express';
import httpStatus from 'http-status';
import * as taskService from '../services/task.service';
import catchAsync from '../utils/catchAsync';

export const getAllTasks: RequestHandler = catchAsync(async (_req: Request, res: Response) => {
  const tasks = await taskService.getAllTasks();
  res.status(httpStatus.OK).json({
    success: true,
    data: tasks,
  });
});

export const getTaskById: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.getTaskById(req.params.id);
  res.status(httpStatus.OK).json({
    success: true,
    data: task,
  });
});

export const createTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.createTask(req.body);
  res.status(httpStatus.CREATED).json({
    success: true,
    data: task,
  });
});

export const updateTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  const task = await taskService.updateTask(req.params.id, req.body);
  res.status(httpStatus.OK).json({
    success: true,
    data: task,
  });
});

export const deleteTask: RequestHandler = catchAsync(async (req: Request, res: Response) => {
  await taskService.deleteTask(req.params.id);
  res.status(httpStatus.NO_CONTENT).send();
});

export const getTasksByAssignee: RequestHandler = catchAsync(
  async (req: Request, res: Response) => {
    const tasks = await taskService.getTasksByAssignee(req.params.userId);
    res.status(httpStatus.OK).json({
      success: true,
      data: tasks,
    });
  },
);
