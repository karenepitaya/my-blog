import type { Request, Response, NextFunction } from 'express';
import { PublicArticleService } from '../services/PublicArticleService';
import { normalizePagination, toOptionalEnum, toOptionalString } from './utils';

type ArticleIdParams = { id: string };
type ArticleSlugParams = { authorId: string; slug: string };
type ArticleAuthorUsernameParams = { authorUsername: string; slug: string };
type PublicArticleListQuery = Record<string, unknown>;

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

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
      const query = getQuery<PublicArticleListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const authorId = toOptionalString(query.authorId);
      const categoryId = toOptionalString(query.categoryId);
      const tag = toOptionalString(query.tag);
      const q = toOptionalString(query.q);
      const sort = toOptionalEnum(query.sort, ['publishedAt', 'random'] as const);
      const result = await PublicArticleService.list({
        page,
        pageSize,
        ...(authorId ? { authorId } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(tag ? { tag } : {}),
        ...(q ? { q } : {}),
        ...(sort ? { sort } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
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
      const { authorId, slug } = getParams<ArticleSlugParams>(req);
      const ip = getClientIp(req);
      const result = ip
        ? await PublicArticleService.detailBySlug({ authorId, slug, ip })
        : await PublicArticleService.detailBySlug({ authorId, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detailByAuthorUsername(req: Request, res: Response, next: NextFunction) {
    try {
      const { authorUsername, slug } = getParams<ArticleAuthorUsernameParams>(req);
      const ip = getClientIp(req);
      const result = ip
        ? await PublicArticleService.detailByAuthorUsername({ authorUsername, slug, ip })
        : await PublicArticleService.detailByAuthorUsername({ authorUsername, slug });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
