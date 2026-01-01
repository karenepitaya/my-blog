import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { getEffectiveUserStatus } from '../utils/userStatus';

function toAuthorProfileDto(user: any) {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    status: getEffectiveUserStatus(user),
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    preferences: toPreferencesDto(user.preferences),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toPreferencesDto(preferences: any) {
  if (!preferences || typeof preferences !== 'object') return undefined;
  const aiConfig = preferences.aiConfig ?? {};
  return {
    aiConfig: {
      apiKey: aiConfig.apiKey ?? null,
      baseUrl: aiConfig.baseUrl ?? null,
      model: aiConfig.model ?? null,
    },
  };
}

async function getAuthorOrThrow(userId: string) {
  const user = await UserRepository.findById(userId);
  if (!user) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
  if (user.role !== 'author') throw { status: 403, code: 'FORBIDDEN', message: 'Author token required' };
  return user as any;
}

export const AuthorProfileService = {
  async me(userId: string) {
    const user = await getAuthorOrThrow(userId);
    return toAuthorProfileDto(user);
  },

  async updateProfile(input: { userId: string; avatarUrl?: string | null; bio?: string | null }) {
    await getAuthorOrThrow(input.userId);

    const update: Record<string, unknown> = {};

    if (input.avatarUrl !== undefined) {
      if (input.avatarUrl === null) {
        update.avatarUrl = null;
      } else {
        const url = String(input.avatarUrl).trim();
        if (!url) {
          update.avatarUrl = null;
        } else if (url.length > 2048) {
          throw { status: 400, code: 'INVALID_AVATAR_URL', message: 'avatarUrl is too long' };
        } else {
          update.avatarUrl = url;
        }
      }
    }

    if (input.bio !== undefined) {
      if (input.bio === null) {
        update.bio = null;
      } else {
        const bio = String(input.bio).trim();
        if (!bio) {
          update.bio = null;
        } else if (bio.length > 500) {
          throw { status: 400, code: 'INVALID_BIO', message: 'bio is too long' };
        } else {
          update.bio = bio;
        }
      }
    }

    if (Object.keys(update).length === 0) {
      return AuthorProfileService.me(input.userId);
    }

    const updated = await UserRepository.updateById(input.userId, update);
    if (!updated) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
    return toAuthorProfileDto(updated);
  },

  async updateAiConfig(input: {
    userId: string;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }) {
    const user = await getAuthorOrThrow(input.userId);
    const preferences = (user as any).preferences ?? {};
    const aiConfig = { ...(preferences.aiConfig ?? {}) } as Record<string, unknown>;

    if (input.apiKey !== undefined) {
      if (input.apiKey === null) {
        aiConfig.apiKey = null;
      } else {
        const apiKey = String(input.apiKey).trim();
        aiConfig.apiKey = apiKey ? apiKey : null;
      }
    }

    if (input.baseUrl !== undefined) {
      if (input.baseUrl === null) {
        aiConfig.baseUrl = null;
      } else {
        const baseUrl = String(input.baseUrl).trim();
        aiConfig.baseUrl = baseUrl ? baseUrl : null;
      }
    }

    if (input.model !== undefined) {
      if (input.model === null) {
        aiConfig.model = null;
      } else {
        const model = String(input.model).trim();
        aiConfig.model = model ? model : null;
      }
    }

    const updated = await UserRepository.updateById(input.userId, {
      preferences: {
        ...preferences,
        aiConfig,
      },
    });
    if (!updated) throw { status: 401, code: 'NOT_AUTHENTICATED', message: 'User not authenticated' };
    return toAuthorProfileDto(updated);
  },

  async changePassword(input: { userId: string; currentPassword: string; newPassword: string }) {
    const user = await getAuthorOrThrow(input.userId);

    const currentPassword = String(input.currentPassword ?? '');
    const newPassword = String(input.newPassword ?? '');

    if (!currentPassword || !newPassword) {
      throw { status: 400, code: 'PASSWORD_REQUIRED', message: 'Password is required' };
    }
    if (newPassword.length < 6 || newPassword.length > 100) {
      throw { status: 400, code: 'INVALID_PASSWORD', message: 'Invalid password' };
    }

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw { status: 401, code: 'AUTH_FAILED', message: 'Invalid password' };

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await UserRepository.updateById(input.userId, { passwordHash });

    return { changed: true, changedAt: new Date().toISOString() };
  },
};
