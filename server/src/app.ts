import express, { type Express } from 'express';
import cors from 'cors';
import routes from './routes/index';
import { responseWrapper } from './middlewares/responseWrapper';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

export const createApp = (): Express => {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(responseWrapper);

  // Routes
  app.use('/api', routes);

  // Not found
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};
