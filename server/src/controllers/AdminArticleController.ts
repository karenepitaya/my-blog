import type { Request, Response, NextFunction } from 'express';
import { ArticleStatuses, type ArticleStatus } from '../interfaces/Article';
import { AdminArticleService } from '../services/AdminArticleService';
import { normalizePagination, pickDefined, toOptionalEnum, toOptionalString } from './utils';

type ArticleIdParams = { id: string };
type AdminArticleListQuery = Record<string, unknown>;
type ScheduleDeleteBody = { graceDays?: number; reason?: string | null };
type AdminMetaBody = { remark?: string | null };

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AdminArticleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<AdminArticleListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const status = toOptionalEnum(query.status, Object.values(ArticleStatuses) as ArticleStatus[]);
      const authorId = toOptionalString(query.authorId);
      const q = toOptionalString(query.q);
      const result = await AdminArticleService.list({
        page,
        pageSize,
        ...(status ? { status } : {}),
        ...(authorId ? { authorId } : {}),
        ...(q ? { q } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const result = await AdminArticleService.detail(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async unpublish(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const result = await AdminArticleService.unpublishToDraft({ actorId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async scheduleDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<ArticleIdParams>(req);
      const body = getBody<ScheduleDeleteBody>(req);
      const result = await AdminArticleService.scheduleDelete({
        actorId,
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
      const { id } = getParams<ArticleIdParams>(req);
      const result = await AdminArticleService.restore(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async purge(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const result = await AdminArticleService.purge(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdminMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<ArticleIdParams>(req);
      const body = getBody<AdminMetaBody>(req);
      const result = await AdminArticleService.updateAdminMeta(id, pickDefined({ remark: body?.remark }));
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
