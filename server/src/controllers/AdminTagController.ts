import type { Request, Response, NextFunction } from 'express';
import { AdminTagService } from '../services/AdminTagService';
import { normalizePagination, toOptionalEnum, toOptionalString } from './utils';

type TagIdParams = { id: string };
type AdminTagListQuery = Record<string, unknown>;
type TagCreateBody = {
  name?: string;
  color?: string | null;
  effect?: string | null;
  description?: string | null;
};
type TagUpdateBody = TagCreateBody;
const TAG_EFFECTS = ['none', 'glow', 'pulse'] as const;
type TagEffect = (typeof TAG_EFFECTS)[number];

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AdminTagController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<AdminTagListQuery>(req);
      const { page, pageSize } = normalizePagination(query);
      const q = toOptionalString(query.q);
      const result = await AdminTagService.list({
        page,
        pageSize,
        ...(q ? { q } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async detail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<TagIdParams>(req);
      const result = await AdminTagService.detail(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const body = getBody<TagCreateBody>(req);
      const effect = toOptionalEnum(body?.effect, TAG_EFFECTS);
      const result = await AdminTagService.create({
        actorId,
        name: String(body?.name ?? ''),
        ...(body?.color !== undefined ? { color: body.color ?? null } : {}),
        ...(effect !== undefined ? { effect: effect as TagEffect } : {}),
        ...(body?.description !== undefined ? { description: body.description ?? null } : {}),
      });
      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<TagIdParams>(req);
      const body = getBody<TagUpdateBody>(req);
      const effect = toOptionalEnum(body?.effect, TAG_EFFECTS);
      const result = await AdminTagService.update({
        actorId,
        id,
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
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const { id } = getParams<TagIdParams>(req);
      const result = await AdminTagService.delete({ actorId, id });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
