import type { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

type FrontendConfig = {
  siteMode?: string;
  maintenance?: unknown;
};

export const PublicSiteStatusController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await SystemConfigService.getAdminEditable();
      const frontend = (config.frontend ?? {}) as FrontendConfig;
      const siteMode = frontend.siteMode === 'maintenance' ? 'maintenance' : 'normal';
      const maintenance = frontend.maintenance ?? null;
      return res.success({
        siteMode,
        maintenance: siteMode === 'maintenance' ? maintenance : null,
      });
    } catch (err) {
      next(err);
    }
  },
};
