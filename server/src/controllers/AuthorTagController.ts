import type { Request, Response, NextFunction } from 'express';
import { AuthorTagService } from '../services/AuthorTagService';
import { normalizePagination, toOptionalEnum, toOptionalString } from './utils';

type TagIdParams = { id: string };
type AuthorTagListQuery = Record<string, unknown>;
type TagWriteBody = {
  name?: string;
  color?: string | null;
  effect?: string | null;
  description?: string | null;
};

const TAG_EFFECTS = ['none', 'glow', 'pulse'] as const;
type TagEffect = (typeof TAG_EFFECTS)[number];

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AuthorTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const query = getQuery<AuthorTagListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const q = toOptionalString(query.q);
      const result = await AuthorTagService.list({
        page,
        pageSize,
        ...(q ? { q } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<TagWriteBody>(req);
      const effect = toOptionalEnum(body?.effect, TAG_EFFECTS);
      const result = await AuthorTagService.create({
        userId,
        name: String(body?.name ?? ''),
        ...(body?.color !== undefined ? { color: body.color } : {}),
        ...(effect !== undefined ? { effect: effect as TagEffect } : {}),
        ...(body?.description !== undefined ? { description: body.description } : {}),
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

      const body = getBody<TagWriteBody>(req);
      const params = getParams<TagIdParams>(req);
      const effect = toOptionalEnum(body?.effect, TAG_EFFECTS);
      const result = await AuthorTagService.update({
        userId,
        id: params.id,
        ...(body?.name !== undefined ? { name: body.name } : {}),
        ...(body?.color !== undefined ? { color: body.color } : {}),
        ...(effect !== undefined ? { effect: effect as TagEffect } : {}),
        ...(body?.description !== undefined ? { description: body.description } : {}),
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

      const params = getParams<TagIdParams>(req);
      const result = await AuthorTagService.delete({ userId, id: params.id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
