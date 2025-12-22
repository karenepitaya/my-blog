import type { Request, Response, NextFunction } from 'express';
import { PublicAuthorService } from '../services/PublicAuthorService';

export const PublicAuthorController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await PublicAuthorService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

