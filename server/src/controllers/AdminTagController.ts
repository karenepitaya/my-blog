import type { Request, Response, NextFunction } from 'express';
import { AdminTagService } from '../services/AdminTagService';

export const AdminTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await AdminTagService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminTagService.detail(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AdminTagService.delete({ actorId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

