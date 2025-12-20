import type { Request, Response, NextFunction } from 'express';
import { PublicCategoryService } from '../services/PublicCategoryService';

export const PublicCategoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await PublicCategoryService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorId, slug } = req.params as any;
      const result = await PublicCategoryService.detailBySlug({ authorId, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

