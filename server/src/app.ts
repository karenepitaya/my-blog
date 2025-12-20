import express, { type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
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

  // Static uploads (local storage)
  const uploadDirName = String(process.env.UPLOAD_DIR ?? 'uploads').trim() || 'uploads';
  const uploadRoute = uploadDirName.startsWith('/') ? uploadDirName : `/${uploadDirName}`;
  const uploadAbsPath = path.resolve(process.cwd(), uploadDirName);
  fs.mkdirSync(uploadAbsPath, { recursive: true });
  app.use(uploadRoute, express.static(uploadAbsPath));

  // Routes
  app.use('/api', routes);

  // Not found
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
};
