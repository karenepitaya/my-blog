import type { Request, Response, NextFunction } from 'express';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';
import { AdminCategoryService } from '../services/AdminCategoryService';
import { normalizePagination, pickDefined, toOptionalEnum, toOptionalString } from './utils';

type CategoryIdParams = { id: string };
type AdminCategoryListQuery = Record<string, unknown>;
type ScheduleDeleteBody = { graceDays?: number };
type AdminMetaBody = { remark?: string | null };

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AdminCategoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<AdminCategoryListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const status = toOptionalEnum(query.status, Object.values(CategoryStatuses) as CategoryStatus[]);
      const ownerId = toOptionalString(query.ownerId);
      const result = await AdminCategoryService.list({
        page,
        pageSize,
        ...(status ? { status } : {}),
        ...(ownerId ? { ownerId } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<CategoryIdParams>(req);
      const result = await AdminCategoryService.detail(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async scheduleDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<CategoryIdParams>(req);
      const body = getBody<ScheduleDeleteBody>(req);
      const result = await AdminCategoryService.scheduleDelete({
        actorId,
        id,
        ...pickDefined({ graceDays: body?.graceDays }),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<CategoryIdParams>(req);
      const result = await AdminCategoryService.restore(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async purge(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<CategoryIdParams>(req);
      const result = await AdminCategoryService.purge(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdminMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<CategoryIdParams>(req);
      const body = getBody<AdminMetaBody>(req);
      const result = await AdminCategoryService.updateAdminMeta(id, pickDefined({ remark: body?.remark }));
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
