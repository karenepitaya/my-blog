import type { Request, RequestHandler } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export const validateRequest = (schemas: RequestSchemas): RequestHandler => {
  return (req, _res, next) => {
    try {
      const requestWithValidated = req as Request & { validated?: Record<string, unknown> };
      const validated: Record<string, unknown> = requestWithValidated.validated ?? {};

      if (schemas.params) {
        const parsedParams = schemas.params.parse(req.params) as Record<string, unknown>;
        const params = req.params as Record<string, unknown>;
        if (params && typeof params === 'object') {
          for (const key of Object.keys(params)) delete params[key];
          Object.assign(params, parsedParams);
        }
        validated.params = parsedParams;
      }
      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query) as Record<string, unknown>;
        const query = req.query as Record<string, unknown>;
        if (query && typeof query === 'object') {
          for (const key of Object.keys(query)) delete query[key];
          Object.assign(query, parsedQuery);
        }
        validated.query = parsedQuery;
      }
      if (schemas.body) {
        const parsedBody = schemas.body.parse(req.body);
        req.body = parsedBody;
        validated.body = parsedBody as unknown;
      }

      requestWithValidated.validated = validated;
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
