import { Router, Request, Response } from 'express';
import taskRoutes from './task.routes';
import { config } from '../config';

const router: Router = Router();

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/tasks', taskRoutes);

export default router;
