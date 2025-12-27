import type { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

export const SystemConfigController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await SystemConfigService.get();
      return res.success(config);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      const body = req.body as any;
      const config = await SystemConfigService.update({
        actorId,
        admin: body.admin,
        frontend: body.frontend,
      });
      return res.success(config);
    } catch (err) {
      next(err);
    }
  },
};
