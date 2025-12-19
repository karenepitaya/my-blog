import type { Request, Response, NextFunction } from 'express';
import { AuthorArticleService } from '../services/AuthorArticleService';

export const AuthorArticleController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await AuthorArticleService.list({ userId, ...query });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.detail({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = req.body as any;
      const result = await AuthorArticleService.create({ userId, ...body });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AuthorArticleService.update({ userId, id, ...body });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.publish({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async unpublish(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.unpublish({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.saveDraft({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AuthorArticleService.remove({
        userId,
        id,
        graceDays: body?.graceDays,
        reason: body?.reason,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.restore({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async requestRestore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const body = req.body as any;
      const result = await AuthorArticleService.requestRestore({ userId, id, message: body?.message });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async confirmDelete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorArticleService.confirmDelete({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

