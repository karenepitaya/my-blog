import type { Request, Response, NextFunction } from 'express';
import { ArticleStatuses, type ArticleStatus } from '../interfaces/Article';
import { AuthorArticleService } from '../services/AuthorArticleService';
import { normalizePagination, pickDefined, toOptionalEnum, toOptionalString } from './utils';

type ArticleIdParams = { id: string };

type ArticleListQuery = {
  page: number;
  pageSize: number;
  status?: 'DRAFT' | 'EDITING' | 'PUBLISHED' | 'PENDING_DELETE';
  q?: string;
  categoryId?: string;
};

type ArticleCreateBody = {
  title: string;
  markdown: string;
  summary?: string | null;
  slug?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  categoryId?: string | null;
  uploadIds?: string[];
};

type ArticleUpdateBody = {
  title?: string;
  markdown?: string;
  summary?: string | null;
  slug?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  categoryId?: string | null;
  uploadIds?: string[];
};

type ArticleDeleteBody = {
  confirm: true;
  graceDays?: number;
  reason?: string | null;
};

type ArticleRestoreRequestBody = {
  message?: string | null;
};

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AuthorArticleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = getQuery<Record<string, unknown>>(req);
      const { page, pageSize } = normalizePagination(query);
      const status = toOptionalEnum(query.status, Object.values(ArticleStatuses) as ArticleStatus[]);
      const q = toOptionalString(query.q);
      const categoryId = toOptionalString(query.categoryId);
      const result = await AuthorArticleService.list({
        userId,
        page,
        pageSize,
        ...(status ? { status } : {}),
        ...(q ? { q } : {}),
        ...(categoryId ? { categoryId } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.detail({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<ArticleCreateBody>(req);
      const result = await AuthorArticleService.create({ userId, ...body });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const body = getBody<ArticleUpdateBody>(req);
      const result = await AuthorArticleService.update({ userId, id, ...body });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.publish({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async unpublish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.unpublish({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.saveDraft({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const body = getBody<ArticleDeleteBody>(req);
      const result = await AuthorArticleService.remove({
        userId,
        id,
        ...pickDefined({ graceDays: body?.graceDays, reason: body?.reason }),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.restore({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async requestRestore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const body = getBody<ArticleRestoreRequestBody>(req);
      const message = typeof body?.message === 'string' ? body.message : undefined;
      const result = await AuthorArticleService.requestRestore({
        userId,
        id,
        ...(message !== undefined ? { message } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async confirmDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AuthorArticleService.confirmDelete({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
