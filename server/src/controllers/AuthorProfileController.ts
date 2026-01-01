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
        displayName: body?.displayName,
        email: body?.email,
        roleTitle: body?.roleTitle,
        emojiStatus: body?.emojiStatus,
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

  async updateAiConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const profile = await AuthorProfileService.updateAiConfig({
        userId,
        vendorId: body?.vendorId,
        apiKey: body?.apiKey,
        baseUrl: body?.baseUrl,
        model: body?.model,
      });
      return res.success(profile);
    } catch (err) {
      next(err);
    }
  },

  async fetchAiModels(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await AuthorProfileService.fetchAiModels({
        userId,
        vendorId: body?.vendorId,
        apiKey: body?.apiKey,
        baseUrl: body?.baseUrl,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async proxyAiRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await AuthorProfileService.proxyAiRequest({
        userId,
        vendorId: body?.vendorId,
        apiKey: body?.apiKey,
        baseUrl: body?.baseUrl,
        model: body?.model,
        prompt: body?.prompt,
        messages: body?.messages,
        temperature: body?.temperature,
        responseFormat: body?.responseFormat,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
