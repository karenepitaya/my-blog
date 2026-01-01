import type { Request, Response, NextFunction } from 'express';
import { AuthorTagService } from '../services/AuthorTagService';

export const AuthorTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = ((req as any).validated?.query ?? req.query) as any;
      const result = await AuthorTagService.list(query);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await AuthorTagService.create({
        userId,
        name: body?.name,
        color: body?.color,
        effect: body?.effect,
        description: body?.description,
      });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const params = ((req as any).validated?.params ?? req.params) as any;
      const result = await AuthorTagService.update({
        userId,
        id: params?.id,
        name: body?.name,
        color: body?.color,
        effect: body?.effect,
        description: body?.description,
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const params = ((req as any).validated?.params ?? req.params) as any;
      const result = await AuthorTagService.delete({ userId, id: params?.id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
