import type { Request, Response, NextFunction } from 'express';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';
import { AuthorCategoryService } from '../services/AuthorCategoryService';
import { toOptionalEnum } from './utils';

type CategoryIdParams = { id: string };
type AuthorCategoryListQuery = { status?: string };
type CategoryWriteBody = {
  name?: string;
  slug?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
};

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AuthorCategoryController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = getQuery<AuthorCategoryListQuery>(req);
      const status = toOptionalEnum(query.status, Object.values(CategoryStatuses) as CategoryStatus[]);

      const result = await AuthorCategoryService.list({
        userId,
        ...(status ? { status } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<CategoryIdParams>(req);
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

      const body = getBody<CategoryWriteBody>(req);
      const slug = typeof body?.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined;
      const category = await AuthorCategoryService.create({
        userId,
        name: String(body?.name ?? ''),
        ...(slug ? { slug } : {}),
        ...(body?.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body?.coverImageUrl !== undefined ? { coverImageUrl: body.coverImageUrl ?? null } : {}),
      });
      return res.success(category, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<CategoryIdParams>(req);
      const body = getBody<CategoryWriteBody>(req);
      const slug = typeof body?.slug === 'string' && body.slug.trim() ? body.slug.trim() : undefined;
      const category = await AuthorCategoryService.update({
        userId,
        id,
        ...(body?.name !== undefined ? { name: body.name } : {}),
        ...(slug ? { slug } : {}),
        ...(body?.description !== undefined ? { description: body.description ?? null } : {}),
        ...(body?.coverImageUrl !== undefined ? { coverImageUrl: body.coverImageUrl ?? null } : {}),
      });
      return res.success(category);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<CategoryIdParams>(req);
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

      const { id } = getParams<CategoryIdParams>(req);
      const result = await AuthorCategoryService.confirmDelete({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<CategoryIdParams>(req);
      const result = await AuthorCategoryService.restore({ userId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
