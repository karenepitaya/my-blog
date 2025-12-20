import type { Request, Response, NextFunction } from 'express';
import { PublicTagService } from '../services/PublicTagService';

export const PublicTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await PublicTagService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params as any;
      const result = await PublicTagService.detailBySlug({ slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

