import type { Request, Response, NextFunction } from 'express';
import { PublicAuthorService } from '../services/PublicAuthorService';
import { normalizePagination, toOptionalString } from './utils';

type AuthorUsernameParams = { username: string };
type PublicAuthorListQuery = Record<string, unknown>;

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

export const PublicAuthorController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<PublicAuthorListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const q = toOptionalString(query.q);
      const result = await PublicAuthorService.list({
        page,
        pageSize,
        ...(q ? { q } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailByUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = getParams<AuthorUsernameParams>(req);
      const result = await PublicAuthorService.detailByUsername({ username });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
