import app from './app';
import { config } from './config';
import logger from './utils/logger';

let server: any;

const startServer = () => {
  server = app.listen(config.port, () => {
    logger.info(`🚀 ${config.serviceName} is running on port ${config.port}`);
    logger.info(`📝 Environment: ${config.env}`);
    logger.info(`🔗 API: http://localhost:${config.port}/api/${config.apiVersion}`);
  });
};

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error('Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});

startServer();
