import type { Request, Response, NextFunction } from 'express';
import { UserStatuses, type UserStatus } from '../interfaces/User';
import { AdminUserService } from '../services/AdminUserService';
import { normalizePagination, pickDefined, toOptionalEnum, toOptionalString } from './utils';

type UserIdParams = { id: string };

type ListUsersQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: 'ACTIVE' | 'BANNED' | 'PENDING_DELETE';
  role?: 'admin' | 'author';
};

type CreateAuthorBody = {
  username: string;
  password?: string;
};

type ReasonBody = {
  reason?: string;
};

type DeleteBody = {
  confirm: true;
  graceDays?: number;
};

type AdminMetaBody = {
  remark?: string | null;
  tags?: string[];
};

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;
const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AdminUserController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<Record<string, unknown>>(req);
      const { page, pageSize } = normalizePagination(query);
      const q = toOptionalString(query.q);
      const status = toOptionalEnum(query.status, Object.values(UserStatuses) as UserStatus[]);
      const role = toOptionalEnum(query.role, ['admin', 'author'] as const);
      const result = await AdminUserService.listUsers({
        page,
        pageSize,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(role ? { role } : {}),
      });
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const user = await AdminUserService.getUserDetail(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async createAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = getBody<CreateAuthorBody>(req);
      const user = await AdminUserService.createAuthor(
        password === undefined ? { username } : { username, password }
      );
      return res.success(user, 201);
    } catch (err) {
      next(err);
    }
  },

  async resetAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const result = await AdminUserService.resetAuthor(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async banAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const { reason } = getBody<ReasonBody>(req);
      const user = await AdminUserService.banAuthor(id, pickDefined({ reason }));
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async unbanAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const user = await AdminUserService.unbanAuthor(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async deleteAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const { graceDays } = getBody<DeleteBody>(req);
      const user = await AdminUserService.scheduleDeleteAuthor(id, pickDefined({ graceDays }));
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async restoreAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const user = await AdminUserService.restoreAuthor(id);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },

  async purgeAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const result = await AdminUserService.purgeAuthor(id);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  async updateAdminMeta(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const { remark, tags } = getBody<AdminMetaBody>(req);
      const payload: { remark?: string | null; tags?: string[] } = {};
      if (remark !== undefined) payload.remark = remark;
      if (Array.isArray(tags)) payload.tags = tags;
      const user = await AdminUserService.updateAdminMeta(id, payload);
      return res.success(user);
    } catch (err) {
      next(err);
    }
  },
};
