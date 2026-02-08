import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { Jwt } from '../utils/jwt';
import { ImpersonationLogRepository } from '../repositories/ImpersonationLogRepository';
import {
  ADMIN_AUTH_COOKIE,
  AUTHOR_AUTH_COOKIE,
  clearAuthCookie,
  setAuthCookie,
} from '../utils/authCookies';

const ADMIN_TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const IMPERSONATE_TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

type UpdateMeBody = {
  avatarUrl?: string | null;
  bio?: string | null;
  displayName?: string | null;
  email?: string | null;
  roleTitle?: string | null;
  emojiStatus?: string | null;
};

type ImpersonateBody = {
  authorId?: string;
  reason?: string | null;
};

const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;

export const AdminAuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.loginAdmin(username, password);
      setAuthCookie(res, ADMIN_AUTH_COOKIE, result.token, ADMIN_TOKEN_MAX_AGE_MS);
      return res.success({ user: result.user });
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
        bio: user.bio ?? null,
        displayName: user.displayName ?? null,
        email: user.email ?? null,
        roleTitle: user.roleTitle ?? null,
        emojiStatus: user.emojiStatus ?? null,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      const body = getBody<UpdateMeBody>(req);
      const update: Record<string, unknown> = {};

      if (body?.avatarUrl !== undefined) update.avatarUrl = body.avatarUrl;
      if (body?.bio !== undefined) update.bio = body.bio;
      if (body?.displayName !== undefined) update.displayName = body.displayName;
      if (body?.email !== undefined) update.email = body.email;
      if (body?.roleTitle !== undefined) update.roleTitle = body.roleTitle;
      if (body?.emojiStatus !== undefined) update.emojiStatus = body.emojiStatus;

      const nextUser = await UserRepository.updateById(userId, update);
      if (!nextUser) {
        return res.error(404, 'NOT_FOUND', 'User not found');
      }

      return res.success({
        id: nextUser._id,
        username: nextUser.username,
        role: nextUser.role,
        status: getEffectiveUserStatus(nextUser),
        avatarUrl: nextUser.avatarUrl ?? null,
        bio: nextUser.bio ?? null,
        displayName: nextUser.displayName ?? null,
        email: nextUser.email ?? null,
        roleTitle: nextUser.roleTitle ?? null,
        emojiStatus: nextUser.emojiStatus ?? null,
        lastLoginAt: nextUser.lastLoginAt ?? null,
        createdAt: nextUser.createdAt,
        updatedAt: nextUser.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  },

  async impersonate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      const body = getBody<ImpersonateBody>(req);
      const authorId = String(body?.authorId ?? '');
      const reason = body?.reason ? String(body.reason) : undefined;

      const author = await UserRepository.findById(authorId);
      if (!author) {
        return res.error(404, 'NOT_FOUND', 'Author not found');
      }

      if (author.role !== 'author') {
        return res.error(400, 'INVALID_TARGET', 'Target user is not an author');
      }

      if (!canUserLogin(author)) {
        return res.error(403, 'ACCOUNT_DISABLED', 'Author account is disabled');
      }

      const expiresIn = '30m' as const;
      const token = Jwt.sign(
        {
          userId: author._id,
          role: author.role,
          impersonatorAdminId: adminId,
        },
        { audience: 'author', expiresIn }
      );

      try {
        const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.ip;
        const userAgent = String(req.headers['user-agent'] ?? '');
        await ImpersonationLogRepository.create({
          adminId,
          authorId: String(author._id),
          reason: reason ?? null,
          ip: ip ? String(ip) : null,
          userAgent: userAgent || null,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        });
      } catch {
        // WHY: Impersonation audits should not block login flow.
      }

      setAuthCookie(res, AUTHOR_AUTH_COOKIE, token, IMPERSONATE_TOKEN_MAX_AGE_MS);
      return res.success({
        user: {
          id: author._id,
          username: author.username,
          role: author.role,
          status: getEffectiveUserStatus(author),
          avatarUrl: author.avatarUrl ?? null,
          displayName: author.displayName ?? null,
          email: author.email ?? null,
          roleTitle: author.roleTitle ?? null,
          emojiStatus: author.emojiStatus ?? null,
          lastLoginAt: author.lastLoginAt ?? null,
          createdAt: author.createdAt,
          updatedAt: author.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async exitImpersonation(req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookie(res, AUTHOR_AUTH_COOKIE);
      return res.success({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookie(res, ADMIN_AUTH_COOKIE);
      clearAuthCookie(res, AUTHOR_AUTH_COOKIE);
      return res.success({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
