import type { Request, Response, NextFunction } from 'express';
import { PublicTagService } from '../services/PublicTagService';
import { normalizePagination, toOptionalString } from './utils';

type TagSlugParams = { slug: string };
type PublicTagListQuery = Record<string, unknown>;

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

export const PublicTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<PublicTagListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const q = toOptionalString(query.q);
      const result = await PublicTagService.list({
        page,
        pageSize,
        ...(q ? { q } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = getParams<TagSlugParams>(req);
      const result = await PublicTagService.detailBySlug({ slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
