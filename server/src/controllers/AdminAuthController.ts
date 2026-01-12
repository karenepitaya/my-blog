import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { Jwt } from '../utils/jwt';
import { ImpersonationLogRepository } from '../repositories/ImpersonationLogRepository';

export const AdminAuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.loginAdmin(username, password);
      return res.success(result);
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

  async impersonate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
      }

      const body = ((req as any).validated?.body ?? req.body) as any;
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
        // Ignore audit persistence failures.
      }

      return res.success({
        token,
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
};
