import type { Request, Response, NextFunction } from 'express';
import { PublicCategoryService } from '../services/PublicCategoryService';
import { normalizePagination, toOptionalString } from './utils';

type CategorySlugParams = { authorId: string; slug: string };
type CategoryAuthorUsernameParams = { authorUsername: string; slug: string };
type PublicCategoryListQuery = Record<string, unknown>;

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

export const PublicCategoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<PublicCategoryListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const authorId = toOptionalString(query.authorId);
      const result = await PublicCategoryService.list({
        page,
        pageSize,
        ...(authorId ? { authorId } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorId, slug } = getParams<CategorySlugParams>(req);
      const result = await PublicCategoryService.detailBySlug({ authorId, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailByAuthorUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorUsername, slug } = getParams<CategoryAuthorUsernameParams>(req);
      const result = await PublicCategoryService.detailByAuthorUsername({ authorUsername, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
