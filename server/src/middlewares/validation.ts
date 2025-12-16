import type { RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

/**
 * 使用 Zod 验证请求数据的中间件
 */
export const validateRequest = (schemas: RequestSchemas): RequestHandler => {
  return (req, _res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: '请求验证失败',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      next(error);
    }
  };
};
