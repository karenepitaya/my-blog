import type { Request, Response, NextFunction } from 'express';
import { AuthorCategoryService } from '../services/AuthorCategoryService';

export const AuthorCategoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = ((req as any).validated?.query ?? req.query) as any;
      const { status } = query;

      const result = await AuthorCategoryService.list({ userId, status });
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
      const category = await AuthorCategoryService.detail({ userId, id });
      return res.success(category);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = req.body as any;
      const category = await AuthorCategoryService.create({ userId, ...body });
      return res.success(category, 201);
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
      const category = await AuthorCategoryService.update({ userId, id, ...body });
      return res.success(category);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = req.params as any;
      const result = await AuthorCategoryService.remove({ userId, id });
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
      const result = await AuthorCategoryService.confirmDelete({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};

