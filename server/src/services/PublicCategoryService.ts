import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CategoryStatuses } from '../interfaces/Category';
import { ArticleStatuses } from '../interfaces/Article';
import { getActiveAuthorIdsCached, isAuthorPubliclyVisible } from './PublicAuthorVisibility';

function toDto(category: any, articleCount: number) {
  return {
    id: String(category._id),
    ownerId: String(category.ownerId),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
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

    const items = categoryCounts
      .map(item => {
        const category = categoryById.get(item.categoryId);
        if (!category) return null;
        if (category.status !== CategoryStatuses.ACTIVE) return null;
        return toDto(category, item.count);
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

    const articleCount = await ArticleRepository.count({
      status: ArticleStatuses.PUBLISHED,
      authorId: new Types.ObjectId(input.authorId),
      categoryId: new Types.ObjectId(String(category._id)),
    });

    return toDto(category, articleCount);
  },
};

