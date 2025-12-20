import type { Request, Response, NextFunction } from 'express';
import { AuthorProfileService } from '../services/AuthorProfileService';

export const AuthorProfileController = {
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const profile = await AuthorProfileService.me(userId);
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const profile = await AuthorProfileService.updateProfile({
        userId,
        avatarUrl: body?.avatarUrl,
        bio: body?.bio,
      });
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await AuthorProfileService.changePassword({
        userId,
        currentPassword: body?.currentPassword,
        newPassword: body?.newPassword,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

