import { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';

const resolveLogDir = () => {
  const base = process.env.LOG_DIR?.trim();
  if (base) return path.resolve(base);
  return path.resolve(process.cwd(), 'logs');
};

const LOG_DIR = resolveLogDir();
const LOG_FILE = path.join(LOG_DIR, 'access.log');

const ensureLogDir = () => {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create log directory:', err);
  }
};

ensureLogDir();

type MaybeUser = {
  id?: string;
  role?: string;
};

export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const user = (req as Request & { user?: MaybeUser }).user;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? '',
      userId: user?.id ?? null,
      userRole: user?.role ?? null,
    };

    fs.appendFile(LOG_FILE, `${JSON.stringify(log)}\n`, (err) => {
      if (err) console.error('Failed to write audit log:', err);
    });
  });

  next();
};
