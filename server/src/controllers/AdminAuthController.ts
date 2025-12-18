import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { getEffectiveUserStatus } from '../utils/userStatus';

export const AdminAuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.loginAdmin(username, password);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      const user = await UserRepository.findById(userId);
      if (!user) {
        return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      return res.success({
        id: user._id,
        username: user.username,
        role: user.role,
        status: getEffectiveUserStatus(user),
        avatarUrl: user.avatarUrl ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },
};

