import type { Request, Response, NextFunction } from 'express';
import type { SystemConfig } from '../interfaces/SystemConfig';
import { SystemConfigService } from '../services/SystemConfigService';

const MASKED_SECRET = '******';

type SystemConfigBody = Partial<Pick<SystemConfig, 'admin' | 'frontend' | 'oss'>>;
type PreviewThemeBody = {
  themes?: SystemConfig['frontend']['themes'];
  enableSeasonEffect?: boolean;
  seasonEffectType?: SystemConfig['frontend']['seasonEffectType'];
  seasonEffectIntensity?: SystemConfig['frontend']['seasonEffectIntensity'];
  enableAnniversaryEffect?: SystemConfig['frontend']['enableAnniversaryEffect'];
};

const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

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
      const body = getBody<SystemConfigBody>(req);
      if (!body.admin || !body.frontend || !body.oss) {
        return res.error(400, 'CONFIG_REQUIRED', 'admin/frontend/oss config is required');
      }
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
      const body = getBody<SystemConfigBody>(req);
      if (!body.admin || !body.frontend || !body.oss) {
        return res.error(400, 'CONFIG_REQUIRED', 'admin/frontend/oss config is required');
      }
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
      const body = getBody<PreviewThemeBody>(req);
      if (!body.themes) {
        return res.error(400, 'THEMES_REQUIRED', 'Themes config is required');
      }
      const result = await SystemConfigService.previewThemeExport({
        actorId,
        themes: body.themes,
        ...(body.enableSeasonEffect !== undefined ? { enableSeasonEffect: body.enableSeasonEffect } : {}),
        ...(body.seasonEffectType !== undefined ? { seasonEffectType: body.seasonEffectType } : {}),
        ...(body.seasonEffectIntensity !== undefined
          ? { seasonEffectIntensity: body.seasonEffectIntensity }
          : {}),
        ...(body.enableAnniversaryEffect !== undefined
          ? { enableAnniversaryEffect: body.enableAnniversaryEffect }
          : {}),
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
      const body = getBody<SystemConfigBody>(req);
      if (!body.admin || !body.frontend || !body.oss) {
        return res.error(400, 'CONFIG_REQUIRED', 'admin/frontend/oss config is required');
      }
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
