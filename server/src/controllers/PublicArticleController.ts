import type { Request, Response, NextFunction } from 'express';
import { PublicArticleService } from '../services/PublicArticleService';

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  return req.ip || undefined;
}

export const PublicArticleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await PublicArticleService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const ip = getClientIp(req);
      const result = ip
        ? await PublicArticleService.detailById({ id, ip })
        : await PublicArticleService.detailById({ id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorId, slug } = req.params as any;
      const ip = getClientIp(req);
      const result = ip
        ? await PublicArticleService.detailBySlug({ authorId, slug, ip })
        : await PublicArticleService.detailBySlug({ authorId, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
