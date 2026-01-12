import type { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

const MASKED_SECRET = '******';

export const SystemConfigController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await SystemConfigService.get();
      if (req.user?.role === 'admin') {
        return res.success({
          ...config,
          oss: {
            ...config.oss,
            secretKey: config.oss?.secretKey ? MASKED_SECRET : '',
          },
        });
      }
      return res.success({
        ...config,
        oss: {
          ...config.oss,
          accessKey: '',
          secretKey: '',
        },
      });
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
        oss: body.oss,
      });
      return res.success(config);
    } catch (err) {
      next(err);
    }
  },
};
