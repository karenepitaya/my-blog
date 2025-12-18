import type { Request, Response, NextFunction } from 'express';
import { AdminUserService } from '../services/AdminUserService';

export const AdminUserController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = ((req as any).validated?.query ?? req.query) as any;
      const { page, pageSize, q, status, role } = query;
      const result = await AdminUserService.listUsers({
        page,
        pageSize,
        q,
        status,
        role,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const user = await AdminUserService.getUserDetail(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body as { username: string; password?: string };
      const user = await AdminUserService.createAuthor(
        password === undefined ? { username } : { username, password }
      );
      return res.success(user, 201);
    } catch (err) {
      next(err);
    }
  },

  async resetAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminUserService.resetAuthor(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async banAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const { reason } = req.body as any;
      const user = await AdminUserService.banAuthor(id, { reason });
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async unbanAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const user = await AdminUserService.unbanAuthor(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async deleteAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const { graceDays } = req.body as any;
      const user = await AdminUserService.scheduleDeleteAuthor(id, { graceDays });
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async restoreAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const user = await AdminUserService.restoreAuthor(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async purgeAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const result = await AdminUserService.purgeAuthor(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdminMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as any;
      const { remark, tags } = req.body as any;
      const user = await AdminUserService.updateAdminMeta(id, { remark, tags });
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },
};
