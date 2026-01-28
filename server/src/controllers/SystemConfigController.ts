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

  async getAdminEditable(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await SystemConfigService.getAdminEditable();
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
      const config = await SystemConfigService.updateDraft({
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

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      const body = req.body as any;
      const config = await SystemConfigService.publish({
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

  async previewTheme(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await SystemConfigService.previewThemeExport({
        actorId,
        themes: body.themes,
        enableSeasonEffect: body.enableSeasonEffect,
        seasonEffectType: body.seasonEffectType,
        seasonEffectIntensity: body.seasonEffectIntensity,
        enableAnniversaryEffect: body.enableAnniversaryEffect,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async previewAll(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await SystemConfigService.previewAllExport({
        actorId,
        admin: body.admin,
        frontend: body.frontend,
        oss: body.oss,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
