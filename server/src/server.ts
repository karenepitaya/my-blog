import mongoose from 'mongoose';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { UserModel } from './models/UserModel';

const startServer = async () => {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected.');

    const admins = await UserModel.find({ role: 'admin' }).select({ username: 1 }).lean();
    if (admins.length > 1) {
      const usernames = admins.map(a => a.username).join(', ');
      logger.error(`Invalid database state: multiple admin users found (${admins.length}): ${usernames}`);
      process.exit(1);
    }

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
