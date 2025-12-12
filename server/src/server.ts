import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected.');

    const app = createApp();
    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
