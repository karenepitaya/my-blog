import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CategoryStatuses } from '../interfaces/Category';
import { ArticleStatuses } from '../interfaces/Article';
import { getActiveAuthorIdsCached, isAuthorPubliclyVisible } from './PublicAuthorVisibility';
import { escapeRegex } from '../utils/regex';

type CategoryDoc = {
  _id: unknown;
  ownerId: unknown;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(category: CategoryDoc, articleCount: number, ownerUsername: string | null) {
  return {
    id: String(category._id),
    ownerId: String(category.ownerId),
    ownerUsername,
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    coverImageUrl: category.coverImageUrl ?? null,
    articleCount,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export const PublicCategoryService = {
  async list(input: { page: number; pageSize: number; authorId?: string }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(200, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    let authorIds: string[] = [];
    if (input.authorId) {
      if (!Types.ObjectId.isValid(input.authorId)) {
        throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
      }

      const visible = await isAuthorPubliclyVisible(input.authorId);
      if (!visible) return { items: [], total: 0, page, pageSize };
      authorIds = [input.authorId];
    } else {
      authorIds = await getActiveAuthorIdsCached();
      if (authorIds.length === 0) return { items: [], total: 0, page, pageSize };
    }

    const activeCategoryIds = await CategoryRepository.findActiveIdsByOwnerIds(authorIds);
    if (activeCategoryIds.length === 0) return { items: [], total: 0, page, pageSize };

    const { items: categoryCounts, total } = await ArticleRepository.listPublishedCategoryCounts({
      authorIds,
      categoryIds: activeCategoryIds,
      skip,
      limit: pageSize,
    });

    if (categoryCounts.length === 0) return { items: [], total, page, pageSize };

    const categoryDocs = await CategoryRepository.findManyByIds(categoryCounts.map(item => item.categoryId));
    const categoryById = new Map(categoryDocs.map(category => [String(category._id), category]));

    const ownerIds = Array.from(new Set(categoryDocs.map(category => String(category.ownerId)).filter(Boolean)));
    const ownerDocs = await UserRepository.list(
      { _id: { $in: ownerIds.map(id => new Types.ObjectId(id)) }, role: 'author' },
      { skip: 0, limit: ownerIds.length, sort: { username: 1 } }
    );
    const ownerById = new Map(ownerDocs.map(owner => [String(owner._id), owner]));

    const items = categoryCounts
      .map(item => {
        const category = categoryById.get(item.categoryId);
        if (!category) return null;
        if (category.status !== CategoryStatuses.ACTIVE) return null;
        const ownerUsername = ownerById.get(String(category.ownerId))?.username ?? null;
        return toDto(category, item.count, ownerUsername);
      })
      .filter(Boolean);

    return { items, total, page, pageSize };
  },

  async detailBySlug(input: { authorId: string; slug: string }) {
    if (!Types.ObjectId.isValid(input.authorId)) {
      throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
    }

    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!slug) throw { status: 400, code: 'SLUG_REQUIRED', message: 'Slug is required' };

    const visible = await isAuthorPubliclyVisible(input.authorId);
    if (!visible) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    const category = await CategoryRepository.findBySlugForOwner(input.authorId, slug);
    if (!category || category.status !== CategoryStatuses.ACTIVE) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    const owner = await UserRepository.findById(input.authorId);
    const ownerUsername = owner?.username ? String(owner.username) : null;

    const articleCount = await ArticleRepository.count({
      status: ArticleStatuses.PUBLISHED,
      authorId: new Types.ObjectId(input.authorId),
      categoryId: new Types.ObjectId(String(category._id)),
    });

    return toDto(category, articleCount, ownerUsername);
  },

  async detailByAuthorUsername(input: { authorUsername: string; slug: string }) {
    const authorUsername = String(input.authorUsername ?? '').trim();
    if (!authorUsername) {
      throw { status: 400, code: 'AUTHOR_REQUIRED', message: 'Author username is required' };
    }

    const users = await UserRepository.list(
      {
        role: 'author',
        username: { $regex: `^${escapeRegex(authorUsername)}$`, $options: 'i' },
      },
      { skip: 0, limit: 2, sort: { username: 1 } }
    );
    const user = users[0];
    if (!user) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    const visible = await isAuthorPubliclyVisible(String(user._id));
    if (!visible) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    return PublicCategoryService.detailBySlug({ authorId: String(user._id), slug: input.slug });
  },
};
