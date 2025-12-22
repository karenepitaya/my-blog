import { Types } from 'mongoose';
import { UserRepository } from '../repositories/UserRepository';
import { getActiveAuthorIdsCached, isAuthorPubliclyVisible } from './PublicAuthorVisibility';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { ArticleStatuses } from '../interfaces/Article';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDto(input: {
  user: any;
  articleCount: number;
}) {
  const user = input.user;
  return {
    id: String(user._id),
    username: user.username,
    avatarUrl: user.avatarUrl ?? null,
    bio: user.bio ?? null,
    articleCount: input.articleCount,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const PublicAuthorService = {
  async list(input: { page: number; pageSize: number; q?: string }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(200, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const authorIds = await getActiveAuthorIdsCached();
    if (authorIds.length === 0) return { items: [], total: 0, page, pageSize };

    const filter: Record<string, unknown> = {
      _id: { $in: authorIds.map((id) => new Types.ObjectId(id)) },
      role: 'author',
    };

    const q = input.q?.trim();
    if (q) {
      filter.username = { $regex: escapeRegex(q), $options: 'i' };
    }

    const [total, users] = await Promise.all([
      UserRepository.count(filter),
      UserRepository.list(filter, { skip, limit: pageSize, sort: { username: 1 } }),
    ]);

    const articleCounts = await Promise.all(
      users.map((user) =>
        ArticleRepository.count({
          status: ArticleStatuses.PUBLISHED,
          authorId: new Types.ObjectId(String(user._id)),
        }),
      ),
    );

    const items = users.map((user, index) =>
      toDto({ user, articleCount: articleCounts[index] ?? 0 }),
    );

    return { items, total, page, pageSize };
  },

  async detailByUsername(input: { username: string }) {
    const username = String(input.username ?? '').trim();
    if (!username) {
      throw { status: 400, code: 'USERNAME_REQUIRED', message: 'Username is required' };
    }

    const users = await UserRepository.list(
      {
        role: 'author',
        username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' },
      },
      { skip: 0, limit: 2, sort: { username: 1 } }
    );
    const user = users[0];
    if (!user) {
      throw { status: 404, code: 'AUTHOR_NOT_FOUND', message: 'Author not found' };
    }

    const visible = await isAuthorPubliclyVisible(String(user._id));
    if (!visible) {
      throw { status: 404, code: 'AUTHOR_NOT_FOUND', message: 'Author not found' };
    }

    const articleCount = await ArticleRepository.count({
      status: ArticleStatuses.PUBLISHED,
      authorId: new Types.ObjectId(String(user._id)),
    });

    return toDto({ user, articleCount });
  },
};
