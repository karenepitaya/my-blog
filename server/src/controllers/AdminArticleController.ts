import type { Request, Response, NextFunction } from 'express';
import { AdminArticleService } from '../services/AdminArticleService';

export const AdminArticleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await AdminArticleService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminArticleService.detail(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async scheduleDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AdminArticleService.scheduleDelete({
        actorId,
        id,
        graceDays: body?.graceDays,
        reason: body?.reason,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminArticleService.restore(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async purge(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminArticleService.purge(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdminMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AdminArticleService.updateAdminMeta(id, { remark: body?.remark });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

