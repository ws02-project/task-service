import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import validate from '../middlewares/validate';
import * as taskValidation from '../validations/task.validation';

const router: Router = Router();

router
  .route('/')
  .get(taskController.getAllTasks)
  .post(validate(taskValidation.createTaskSchema), taskController.createTask);

router
  .route('/:id')
  .get(validate(taskValidation.getTaskSchema), taskController.getTaskById)
  .patch(validate(taskValidation.updateTaskSchema), taskController.updateTask)
  .delete(validate(taskValidation.deleteTaskSchema), taskController.deleteTask);

export default router;
