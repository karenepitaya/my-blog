import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';

const DEFAULT_DELETE_GRACE_DAYS = 7;

function toAdminDto(category: any) {
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
    deletedBy: category.deletedBy ? String(category.deletedBy) : null,
    deleteScheduledAt: category.deleteScheduledAt ?? null,
    adminRemark: category.adminRemark ?? null,
    articleCount: stats?.articleCount ?? 0,
    views: stats?.views ?? 0,
    likes: stats?.likes ?? 0,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export const AdminCategoryService = {
  async list(input: {
    page: number;
    pageSize: number;
    status?: CategoryStatus;
    ownerId?: string;
  }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (input.status) filter.status = input.status;
    if (input.ownerId) {
      if (!Types.ObjectId.isValid(input.ownerId)) {
        throw { status: 400, code: 'INVALID_OWNER_ID', message: 'Invalid owner id' };
      }
      filter.ownerId = new Types.ObjectId(input.ownerId);
    }

    const [total, items] = await Promise.all([
      CategoryRepository.count(filter),
      CategoryRepository.list(filter, { skip, limit: pageSize, sort: { createdAt: -1 } }),
    ]);

    const ids = items.map(item => String((item as any)._id));
    const statsMap = await ArticleRepository.aggregateStatsByCategoryIds(ids);
    const itemsWithStats = items.map(item => {
      const id = String((item as any)._id);
      const stats = statsMap[id] ?? { articleCount: 0, views: 0 };
      return { ...(item as any).toObject?.() ?? item, stats: { ...stats, likes: 0 } };
    });

    return { items: itemsWithStats.map(toAdminDto), total, page, pageSize };
  },

  async detail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }
    const category = await CategoryRepository.findById(id);
    if (!category) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    const statsMap = await ArticleRepository.aggregateStatsByCategoryIds([String((category as any)._id)]);
    const stats = statsMap[String((category as any)._id)] ?? { articleCount: 0, views: 0 };
    return toAdminDto({ ...(category as any).toObject?.() ?? category, stats: { ...stats, likes: 0 } });
  },

  async scheduleDelete(input: { actorId: string; id: string; graceDays?: number }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findById(input.id);
    if (!category) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    const graceDays =
      input.graceDays === undefined
        ? DEFAULT_DELETE_GRACE_DAYS
        : Math.max(1, Math.min(30, Math.floor(input.graceDays)));
    const deleteScheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    const updated = await CategoryRepository.updateById(input.id, {
      status: CategoryStatuses.PENDING_DELETE,
      deletedAt: new Date(),
      deletedByRole: 'admin',
      deletedBy: new Types.ObjectId(input.actorId),
      deleteScheduledAt,
    });

    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    return toAdminDto(updated);
  },

  async restore(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findById(id);
    if (!category) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    if (category.status !== CategoryStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Category is not pending deletion' };
    }

    const updated = await CategoryRepository.updateById(id, {
      status: CategoryStatuses.ACTIVE,
      deletedAt: null,
      deletedByRole: null,
      deletedBy: null,
      deleteScheduledAt: null,
    });
    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    return toAdminDto(updated);
  },

  async purge(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findById(id);
    if (!category) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    if (category.status !== CategoryStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Category is not pending deletion' };
    }

    await ArticleRepository.removeCategoryFromAllArticles(id);
    await CategoryRepository.deleteHardById(id);
    return { id, purged: true, purgedAt: new Date().toISOString() };
  },

  async updateAdminMeta(id: string, input: { remark?: string | null }) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findById(id);
    if (!category) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    const update: Record<string, unknown> = {};
    if (input.remark !== undefined) {
      update.adminRemark = input.remark === null ? null : String(input.remark).trim();
    }

    const updated = await CategoryRepository.updateById(id, update);
    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    return toAdminDto(updated);
  },
};
