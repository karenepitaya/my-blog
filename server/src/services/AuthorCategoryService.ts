import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { createSlug } from '../utils/slug';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';
import { getRecycleBinRetentionDays } from './RecycleBinPolicyService';

function toDto(category: any) {
  const stats = (category as any).stats as { articleCount?: number; views?: number; likes?: number } | undefined;
  return {
    id: String(category._id),
    ownerId: String(category.ownerId),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    coverImageUrl: category.coverImageUrl ?? null,
    status: category.status,
    deletedAt: category.deletedAt ?? null,
    deletedByRole: category.deletedByRole ?? null,
    deleteScheduledAt: category.deleteScheduledAt ?? null,
    articleCount: stats?.articleCount ?? 0,
    views: stats?.views ?? 0,
    likes: stats?.likes ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export const AuthorCategoryService = {
  async list(input: { userId: string; status?: CategoryStatus }) {
    const status = input.status ?? CategoryStatuses.ACTIVE;
    const items = await CategoryRepository.listForOwner(input.userId, { status });

    const ids = items.map(item => String((item as any)._id));
    const statsMap = await ArticleRepository.aggregateStatsByCategoryIds(ids);
    const itemsWithStats = items.map(item => {
      const id = String((item as any)._id);
      const stats = statsMap[id] ?? { articleCount: 0, views: 0 };
      return { ...(item as any).toObject?.() ?? item, stats: { ...stats, likes: 0 } };
    });

    return { items: itemsWithStats.map(toDto) };
  },

  async detail(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    const statsMap = await ArticleRepository.aggregateStatsByCategoryIds([String((category as any)._id)]);
    const stats = statsMap[String((category as any)._id)] ?? { articleCount: 0, views: 0 };
    return toDto({ ...(category as any).toObject?.() ?? category, stats: { ...stats, likes: 0 } });
  },

  async create(input: {
    userId: string;
    name: string;
    slug?: string;
    description?: string | null;
    coverImageUrl?: string | null;
  }) {
    const name = String(input.name ?? '').trim();
    if (!name) throw { status: 400, code: 'NAME_REQUIRED', message: 'Category name is required' };

    const nameExists = await CategoryRepository.isNameExists({ ownerId: input.userId, name });
    if (nameExists) throw { status: 409, code: 'DUPLICATE_NAME', message: 'Category name already exists' };

    let slug = input.slug ? createSlug(String(input.slug)) : createSlug(name);
    if (!slug) throw { status: 400, code: 'INVALID_SLUG', message: 'Invalid slug' };

    let finalSlug = slug;
    let counter = 1;
    while (await CategoryRepository.isSlugExists({ ownerId: input.userId, slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await CategoryRepository.create({
      ownerId: input.userId,
      name,
      slug: finalSlug,
      description: input.description ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      status: CategoryStatuses.ACTIVE,
    });

    return toDto(category);
  },

  async update(input: {
    userId: string;
    id: string;
    name?: string;
    slug?: string;
    description?: string | null;
    coverImageUrl?: string | null;
  }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    if (existing.status !== CategoryStatuses.ACTIVE) {
      throw { status: 409, code: 'CATEGORY_NOT_ACTIVE', message: 'Category is not active' };
    }

    const update: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (!name) throw { status: 400, code: 'INVALID_NAME', message: 'Invalid category name' };
      if (name !== existing.name) {
        const exists = await CategoryRepository.isNameExists({
          ownerId: input.userId,
          name,
          excludeId: input.id,
        });
        if (exists) throw { status: 409, code: 'DUPLICATE_NAME', message: 'Category name already exists' };
        update.name = name;
      }
    }

    if (input.slug !== undefined) {
      const slug = createSlug(String(input.slug));
      if (!slug) throw { status: 400, code: 'INVALID_SLUG', message: 'Invalid slug' };
      if (slug !== existing.slug) {
        const exists = await CategoryRepository.isSlugExists({
          ownerId: input.userId,
          slug,
          excludeId: input.id,
        });
        if (exists) throw { status: 409, code: 'DUPLICATE_SLUG', message: 'Category slug already exists' };
        update.slug = slug;
      }
    }

    if (input.description !== undefined) {
      update.description = input.description === null ? null : String(input.description).trim();
    }

    if (input.coverImageUrl !== undefined) {
      update.coverImageUrl = input.coverImageUrl === null ? null : String(input.coverImageUrl).trim();
    }

    const updated = await CategoryRepository.updateForOwner(input.id, input.userId, update);
    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    return toDto(updated);
  },

  async remove(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    if (existing.status === CategoryStatuses.PENDING_DELETE) {
      return {
        id: input.id,
        status: existing.status,
        deleteScheduledAt: existing.deleteScheduledAt ?? null,
      };
    }

    const graceDays = await getRecycleBinRetentionDays();
    const deleteScheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);
    const updated = await CategoryRepository.updateForOwner(input.id, input.userId, {
      status: CategoryStatuses.PENDING_DELETE,
      deletedAt: new Date(),
      deletedByRole: 'author',
      deletedBy: new Types.ObjectId(input.userId),
      deleteScheduledAt,
    });

    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    return {
      id: input.id,
      status: CategoryStatuses.PENDING_DELETE,
      deleteScheduledAt,
    };
  },

  async restore(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    if (existing.status !== CategoryStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Category is not pending deletion' };
    }

    if (existing.deletedByRole === 'admin') {
      throw {
        status: 403,
        code: 'ADMIN_DELETE_REQUIRES_REVIEW',
        message: 'Admin-deleted category cannot be restored by author',
      };
    }

    const updated = await CategoryRepository.updateForOwner(input.id, input.userId, {
      status: CategoryStatuses.ACTIVE,
      deletedAt: null,
      deletedByRole: null,
      deletedBy: null,
      deleteScheduledAt: null,
    });

    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    return toDto(updated);
  },

  async confirmDelete(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    if (existing.status !== CategoryStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Category is not pending deletion' };
    }
    if (existing.deletedByRole === 'admin') {
      throw {
        status: 403,
        code: 'FORBIDDEN',
        message: 'Admin-deleted category cannot be purged by author',
      };
    }

    await ArticleRepository.removeCategoryFromAllArticles(input.id);
    await CategoryRepository.deleteHardById(input.id);
    return { id: input.id, purged: true, purgedAt: new Date().toISOString() };
  },
};
