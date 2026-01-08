import type { Request, Response, NextFunction } from 'express';
import { AdminConfigDiagnosticsService } from '../services/AdminConfigDiagnosticsService';

export const AdminConfigDiagnosticsController = {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const diagnostics = await AdminConfigDiagnosticsService.getDiagnostics();
      return res.success(diagnostics);
    } catch (err) {
      next(err);
    }
  },
};

