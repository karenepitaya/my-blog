import express, { type Express, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes/index';
import { auditLogger } from './middlewares/auditLogger';
import { responseWrapper } from './middlewares/responseWrapper';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';
import { sanitizeUploadDir } from './utils/uploadDir';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');

  if (process.env.NODE_ENV !== 'production') {
    // CONTRACT: Dev CORS only allows local admin (3001) and frontend (4321) origins.
    const allowedOrigins = new Set([
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://localhost:4321',
      'http://127.0.0.1:4321',
    ]);

    // Allow additional origins via environment variable for complex dev setups
    // e.g., DEV_CORS_ORIGINS=http://192.168.1.100:3001,http://10.0.0.5:3001
    const extraOrigins = process.env.DEV_CORS_ORIGINS?.split(',').map(s => s.trim()).filter(Boolean) || [];
    extraOrigins.forEach(origin => allowedOrigins.add(origin));

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          return callback(null, allowedOrigins.has(origin));
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        maxAge: 600,
      })
    );
  }
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(responseWrapper);
  app.use(auditLogger);

  const sendRateLimit = (res: Response) => {
    const responder = res as Response & {
      error?: (statusCode: number, code: string, message: string, details?: unknown) => Response;
    };
    if (typeof responder.error === 'function') {
      return responder.error(429, 'RATE_LIMITED', '请求过于频繁，请稍后再试');
    }
    return res.status(429).json({
      success: false,
      data: null,
      error: { code: 'RATE_LIMITED', message: '请求过于频繁，请稍后再试' },
    });
  };

  const isDev = process.env.NODE_ENV !== 'production';
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: isDev ? 1000 : 100,  // 开发环境放宽到 1000 次/分钟
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || isDev,  // 开发环境完全跳过
    handler: (_req, res) => sendRateLimit(res),
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 1000 : 5,  // 开发环境放宽到 1000 次
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || isDev,  // 开发环境完全跳过
    skipSuccessfulRequests: !isDev,  // 开发环境不跳过成功请求
    handler: (_req, res) => sendRateLimit(res),
  });

  const uploadDirName = sanitizeUploadDir(process.env.UPLOAD_DIR);
  const uploadRoute = uploadDirName.startsWith('/') ? uploadDirName : `/${uploadDirName}`;
  const uploadAbsPath = path.resolve(process.cwd(), uploadDirName);
  fs.mkdirSync(uploadAbsPath, { recursive: true });
  app.use(uploadRoute, express.static(uploadAbsPath));

  app.use('/api', apiLimiter);
  app.use('/api/auth/login', authLimiter);
  app.use('/api/admin/auth/login', authLimiter);
  app.use('/api', routes);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
};
