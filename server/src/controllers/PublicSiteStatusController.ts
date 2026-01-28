import type { Request, Response, NextFunction } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

export const PublicSiteStatusController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await SystemConfigService.getAdminEditable();
      const siteMode = (config.frontend as any).siteMode === 'maintenance' ? 'maintenance' : 'normal';
      const maintenance = (config.frontend as any).maintenance ?? null;
      return res.success({
        siteMode,
        maintenance: siteMode === 'maintenance' ? maintenance : null,
      });
    } catch (err) {
      next(err);
    }
  },
};

