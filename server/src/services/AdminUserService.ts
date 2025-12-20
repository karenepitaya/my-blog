import bcrypt from 'bcryptjs';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { UserRepository } from '../repositories/UserRepository';
import { UserStatuses, type UserStatus } from '../interfaces/User';
import { generateInitialPassword } from '../utils/password';
import { getEffectiveUserStatus } from '../utils/userStatus';

const DEFAULT_DELETE_GRACE_DAYS = 30;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAdminUserDto(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    status: getEffectiveUserStatus(user),
    isActive: user.isActive ?? true,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    bannedAt: user.bannedAt ?? null,
    bannedReason: user.bannedReason ?? null,
    deleteScheduledAt: user.deleteScheduledAt ?? null,
    adminRemark: user.adminRemark ?? null,
    adminTags: user.adminTags ?? [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function getAuthorOrThrow(id: string) {
  const user = await UserRepository.findById(id);
  if (!user) {
    throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
  }
  if (user.role !== 'author') {
    throw { status: 400, code: 'INVALID_TARGET', message: 'Only author accounts are manageable' };
  }
  return user as any;
}

export const AdminUserService = {
  async createAuthor(input: { username: string; password?: string }) {
    const username = input.username.trim();

    const existing = await UserRepository.findByUsername(username);
    if (existing) {
      throw { status: 409, code: 'USERNAME_EXISTS', message: 'Username already exists' };
    }

    const initialPassword = input.password ?? generateInitialPassword();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const user = await UserRepository.createAuthor({
      username,
      passwordHash,
      isActive: true,
      status: UserStatuses.ACTIVE,
    });

    return {
      user: toAdminUserDto(user),
      initialPassword: input.password ? null : initialPassword,
    };
  },

  async listUsers(input: {
    page: number;
    pageSize: number;
    q?: string;
    status?: UserStatus;
    role?: 'admin' | 'author';
  }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    filter.role = input.role ?? 'author';

    if (input.q) {
      filter.username = { $regex: escapeRegex(input.q.trim()), $options: 'i' };
    }

    if (input.status) {
      if (input.status === UserStatuses.ACTIVE) {
        filter.$or = [
          { status: UserStatuses.ACTIVE },
          { status: { $exists: false }, isActive: true },
        ];
      } else if (input.status === UserStatuses.BANNED) {
        filter.$or = [
          { status: UserStatuses.BANNED },
          { status: { $exists: false }, isActive: false },
        ];
      } else {
        filter.status = input.status;
      }
    }

    const [total, users] = await Promise.all([
      UserRepository.count(filter),
      UserRepository.list(filter, {
        skip,
        limit: pageSize,
        sort: { createdAt: -1 },
      }),
    ]);

    return {
      items: users.map(toAdminUserDto),
      total,
      page,
      pageSize,
    };
  },

  async getUserDetail(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }
    return toAdminUserDto(user);
  },

  async resetAuthor(id: string) {
    const user = await getAuthorOrThrow(id);

    const initialPassword = generateInitialPassword();
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const updated = await UserRepository.updateById(id, {
      passwordHash,
      avatarUrl: null,
      bio: null,

      isActive: true,
      status: UserStatuses.ACTIVE,
      bannedAt: null,
      bannedReason: null,
      deleteScheduledAt: null,
    });

    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return { user: toAdminUserDto(updated), initialPassword };
  },

  async banAuthor(id: string, input?: { reason?: string }) {
    await getAuthorOrThrow(id);

    const updated = await UserRepository.updateById(id, {
      isActive: false,
      status: UserStatuses.BANNED,
      bannedAt: new Date(),
      bannedReason: input?.reason?.trim() ? input.reason.trim() : null,
    });

    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return toAdminUserDto(updated);
  },

  async unbanAuthor(id: string) {
    const user = await getAuthorOrThrow(id);

    const status = getEffectiveUserStatus(user);
    if (status !== UserStatuses.BANNED) {
      throw { status: 409, code: 'NOT_BANNED', message: 'User is not banned' };
    }

    const updated = await UserRepository.updateById(id, {
      isActive: true,
      status: UserStatuses.ACTIVE,
      bannedAt: null,
      bannedReason: null,
    });

    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return toAdminUserDto(updated);
  },

  async scheduleDeleteAuthor(id: string, input: { graceDays?: number }) {
    await getAuthorOrThrow(id);

    const graceDays =
      input.graceDays === undefined
        ? DEFAULT_DELETE_GRACE_DAYS
        : Math.max(1, Math.min(365, Math.floor(input.graceDays)));

    const deleteScheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    const updated = await UserRepository.updateById(id, {
      isActive: false,
      status: UserStatuses.PENDING_DELETE,
      deleteScheduledAt,
    });

    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return toAdminUserDto(updated);
  },

  async restoreAuthor(id: string) {
    const user = await getAuthorOrThrow(id);
    const status = getEffectiveUserStatus(user);
    if (status !== UserStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'User is not pending deletion' };
    }

    const updated = await UserRepository.updateById(id, {
      isActive: true,
      status: UserStatuses.ACTIVE,
      deleteScheduledAt: null,
    });

    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return toAdminUserDto(updated);
  },

  async updateAdminMeta(id: string, input: { remark?: string | null; tags?: string[] }) {
    await getAuthorOrThrow(id);

    const update: Record<string, unknown> = {};

    if (input.remark !== undefined) {
      update.adminRemark = input.remark === null ? null : input.remark.trim();
    }

    if (input.tags !== undefined) {
      const tags = (input.tags ?? [])
        .map(t => t.trim())
        .filter(Boolean);
      update.adminTags = Array.from(new Set(tags));
    }

    const updated = await UserRepository.updateById(id, update);
    if (!updated) {
      throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
    }

    return toAdminUserDto(updated);
  },

  async purgeAuthor(id: string) {
    const user = await getAuthorOrThrow(id);
    const status = getEffectiveUserStatus(user);

    if (status !== UserStatuses.PENDING_DELETE) {
      throw {
        status: 409,
        code: 'NOT_PENDING_DELETE',
        message: 'User is not pending deletion',
      };
    }

    const categoryIds = await CategoryRepository.findIdsByOwnerIds([id]);
    const detachedArticlesFromCategories = await ArticleRepository.removeCategoriesFromAllArticles(categoryIds);

    const { deletedArticles, deletedContents } = await ArticleRepository.deleteHardByAuthorIds([id]);
    const deletedCategories = await CategoryRepository.deleteHardByOwnerIds([id]);

    const deleted = await UserRepository.deleteById(id);
    if (!deleted) throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };

    return {
      id,
      purged: true,
      purgedAt: new Date().toISOString(),
      deletedArticles,
      deletedArticleContents: deletedContents,
      deletedCategories,
      detachedArticlesFromCategories,
    };
  },
};
