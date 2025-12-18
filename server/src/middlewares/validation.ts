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
      const validated = ((req as any).validated ?? {}) as Record<string, unknown>;

      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as any;
        const params = req.params as any;
        if (params && typeof params === 'object') {
          for (const key of Object.keys(params)) delete params[key];
          Object.assign(params, parsedParams);
        }
        validated.params = parsedParams;
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as any;
        const query = req.query as any;
        if (query && typeof query === 'object') {
          for (const key of Object.keys(query)) delete query[key];
          Object.assign(query, parsedQuery);
        }
        validated.query = parsedQuery;
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as any;
        validated.body = req.body;
      }

      (req as any).validated = validated;
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
