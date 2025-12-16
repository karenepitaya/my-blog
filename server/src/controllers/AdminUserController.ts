import type { Request, Response, NextFunction } from 'express';
import { AdminUserService } from '../services/AdminUserService';

export const AdminUserController = {
  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body as { username: string; password: string };
      const user = await AdminUserService.createAuthor({ username, password });
      return res.success(user, 201);
    } catch (err) {
      next(err);
    }
  },
};

