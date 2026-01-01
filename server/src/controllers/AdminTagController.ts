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

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = req.body as any;
      const result = await AdminTagService.create({
        actorId,
        name: body?.name,
        color: body?.color ?? null,
        effect: body?.effect ?? undefined,
        description: body?.description ?? null,
      });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AdminTagService.update({
        actorId,
        id,
        name: body?.name,
        color: body?.color,
        effect: body?.effect ?? undefined,
        description: body?.description,
      });
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
