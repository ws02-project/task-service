import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import validate from '../middlewares/validate';
import { authenticate, authorize } from '../middlewares/auth';
import * as taskValidation from '../validations/task.validation';

const router: Router = Router();

// All routes require authentication
router.use(authenticate);

// List all tasks - all authenticated users
// Create task - all authenticated users
router
  .route('/')
  .get(taskController.getAllTasks)
  .post(validate(taskValidation.createTaskSchema), taskController.createTask);

// Get task - all authenticated users
// Update task - all authenticated users (can update assigned tasks)
// Delete task - admin only
router
  .route('/:id')
  .get(validate(taskValidation.getTaskSchema), taskController.getTaskById)
  .patch(validate(taskValidation.updateTaskSchema), taskController.updateTask)
  .delete(authorize('admin'), validate(taskValidation.deleteTaskSchema), taskController.deleteTask);

export default router;
