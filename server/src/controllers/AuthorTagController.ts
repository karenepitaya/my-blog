import type { Request, Response, NextFunction } from 'express';
import { AuthorTagService } from '../services/AuthorTagService';

export const AuthorTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await AuthorTagService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = req.body as any;
      const result = await AuthorTagService.create({ userId, name: body?.name });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },
};

