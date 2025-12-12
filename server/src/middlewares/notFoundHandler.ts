import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return res.error(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found.`);
};
