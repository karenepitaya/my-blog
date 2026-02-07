import type { Request, Response, NextFunction } from 'express';
import { PublicArticleLikeService } from '../services/PublicArticleLikeService';

type ArticleIdParams = { id: string };

const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

export const PublicArticleLikeController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const result = await PublicArticleLikeService.get(req, { id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async like(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const result = await PublicArticleLikeService.like(req, { id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async unlike(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const result = await PublicArticleLikeService.unlike(req, { id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

