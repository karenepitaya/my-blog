import { Request, Response, NextFunction } from 'express';

type ErrorLike = {
  status?: number;
  code?: string;
  message?: string;
  details?: unknown;
};

export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error('Global Error:', err);

  const error = typeof err === 'object' && err !== null ? (err as ErrorLike) : {};
  const status = typeof error.status === 'number' ? error.status : 500;
  const code = typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';
  const isProd = process.env.NODE_ENV === 'production';
  const shouldExpose = !isProd || status < 500;

  const message =
    shouldExpose && typeof error.message === 'string' && error.message
      ? error.message
      : 'Internal Server Error';
  const details = shouldExpose ? error.details : undefined;

  return res.error(status, code, message, details);
};
