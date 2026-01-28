import { Types } from 'mongoose';
import { ArticleModel, type ArticleDocument } from '../models/ArticleModel';
import { ArticleContentModel, type ArticleContentDocument } from '../models/ArticleContentModel';
import { ArticleStatuses, type TocItem } from '../interfaces/Article';

export const ArticleRepository = {
  async createMeta(data: {
    authorId: string;
    title: string;
    slug: string;
    summary?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    categoryId?: string | null;
    status: string;
  }): Promise<ArticleDocument> {
    const article = new ArticleModel({
      authorId: new Types.ObjectId(data.authorId),
      title: data.title,
      slug: data.slug,
      summary: data.summary ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      tags: data.tags ?? [],
      categoryId: data.categoryId ? new Types.ObjectId(data.categoryId) : null,
      status: data.status,
    });
    return article.save();
  },

  async createContent(data: {
    articleId: string;
    markdown: string;
    html?: string | null;
    toc?: TocItem[];
    renderedAt?: Date | null;
    renderer?: string | null;
  }): Promise<ArticleContentDocument> {
    const content = new ArticleContentModel({
      articleId: new Types.ObjectId(data.articleId),
      markdown: data.markdown,
      html: data.html ?? null,
      toc: data.toc ?? [],
      renderedAt: data.renderedAt ?? null,
      renderer: data.renderer ?? null,
    });
    return content.save();
  },

  async findMetaById(id: string): Promise<ArticleDocument | null> {
    return ArticleModel.findById(id).exec();
  },

  async findMetaByIdForAuthor(id: string, authorId: string): Promise<ArticleDocument | null> {
    return ArticleModel.findOne({ _id: id, authorId: new Types.ObjectId(authorId) }).exec();
  },

  async findMetaBySlugForAuthor(authorId: string, slug: string): Promise<ArticleDocument | null> {
    return ArticleModel.findOne({ authorId: new Types.ObjectId(authorId), slug }).exec();
  },

  async findContentByArticleId(articleId: string): Promise<ArticleContentDocument | null> {
    return ArticleContentModel.findOne({ articleId: new Types.ObjectId(articleId) }).exec();
  },

  async listForAuthor(
    authorId: string,
    filter: Record<string, unknown>,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<ArticleDocument[]> {
    const query = ArticleModel.find({ authorId: new Types.ObjectId(authorId), ...filter });
    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === 'number') query.skip(options.skip);
    if (typeof options.limit === 'number') query.limit(options.limit);
    return query.exec();
  },

  async countForAuthor(authorId: string, filter: Record<string, unknown>): Promise<number> {
    return ArticleModel.countDocuments({ authorId: new Types.ObjectId(authorId), ...filter }).exec();
  },

  async list(
    filter: Record<string, unknown>,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<ArticleDocument[]> {
    const query = ArticleModel.find(filter);
    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === 'number') query.skip(options.skip);
    if (typeof options.limit === 'number') query.limit(options.limit);
    return query.exec();
  },

  async sample(filter: Record<string, unknown>, size: number): Promise<any[]> {
    const limit = Math.max(1, Math.min(100, Math.floor(size)));
    return ArticleModel.aggregate([{ $match: filter }, { $sample: { size: limit } }]).exec();
  },

  async count(filter: Record<string, unknown>): Promise<number> {
    return ArticleModel.countDocuments(filter).exec();
  },

  async updateMetaById(id: string, update: Record<string, unknown>): Promise<ArticleDocument | null> {
    return ArticleModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  },

  async updateMetaForAuthor(
    id: string,
    authorId: string,
    update: Record<string, unknown>
  ): Promise<ArticleDocument | null> {
    return ArticleModel.findOneAndUpdate(
      { _id: id, authorId: new Types.ObjectId(authorId) },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async updateContentByArticleId(
    articleId: string,
    update: Record<string, unknown>
  ): Promise<ArticleContentDocument | null> {
    return ArticleContentModel.findOneAndUpdate(
      { articleId: new Types.ObjectId(articleId) },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async deleteHardById(id: string): Promise<void> {
    const objectId = new Types.ObjectId(id);
    await ArticleContentModel.deleteOne({ articleId: objectId }).exec();
    await ArticleModel.findByIdAndDelete(objectId).exec();
  },

  async deleteHardForAuthor(id: string, authorId: string): Promise<boolean> {
    const deleted = await ArticleModel.findOneAndDelete({ _id: id, authorId: new Types.ObjectId(authorId) }).exec();
    if (!deleted) return false;

    await ArticleContentModel.deleteOne({ articleId: new Types.ObjectId(id) }).exec();
    return true;
  },

  async deleteHardByAuthorIds(authorIds: string[]): Promise<{ deletedArticles: number; deletedContents: number }> {
    if (authorIds.length === 0) return { deletedArticles: 0, deletedContents: 0 };

    const authorObjectIds = authorIds.map(id => new Types.ObjectId(id));
    const ids = await ArticleModel.find({ authorId: { $in: authorObjectIds } })
      .select({ _id: 1 })
      .lean()
      .exec();

    if (ids.length === 0) return { deletedArticles: 0, deletedContents: 0 };

    const articleIds = ids.map(item => item._id);

    const contentResult = await ArticleContentModel.deleteMany({
      articleId: { $in: articleIds },
    }).exec();

    const articleResult = await ArticleModel.deleteMany({
      _id: { $in: articleIds },
    }).exec();

    return {
      deletedArticles: articleResult.deletedCount ?? 0,
      deletedContents: contentResult.deletedCount ?? 0,
    };
  },

  async softDeleteByAuthorIds(input: {
    authorIds: string[];
    deletedByRole: 'admin' | 'author';
    deletedBy?: string | null;
    deleteScheduledAt?: Date | null;
    deleteReason?: string | null;
  }): Promise<number> {
    if (input.authorIds.length === 0) return 0;

    const authorObjectIds = input.authorIds.map(id => new Types.ObjectId(id));
    const now = new Date();
    const deletedBy = input.deletedBy ? new Types.ObjectId(input.deletedBy) : null;

    const updatePipeline = [
      {
        $set: {
          preDeleteStatus: { $ifNull: ['$preDeleteStatus', '$status'] },
          status: ArticleStatuses.PENDING_DELETE,
          deletedAt: now,
          deletedByRole: input.deletedByRole,
          deletedBy,
          deleteScheduledAt: input.deleteScheduledAt ?? null,
          deleteReason: input.deleteReason ?? null,
          restoreRequestedAt: null,
          restoreRequestedMessage: null,
        },
      },
    ];

    const result = await (ArticleModel as any).updateMany(
      { authorId: { $in: authorObjectIds }, status: { $ne: ArticleStatuses.PENDING_DELETE } },
      updatePipeline
    ).exec();

    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async transferDeletedByAuthorIds(input: {
    authorIds: string[];
    deletedBy: string;
    deleteScheduledAt?: Date | null;
  }): Promise<number> {
    if (input.authorIds.length === 0) return 0;

    const authorObjectIds = input.authorIds.map(id => new Types.ObjectId(id));
    const deletedBy = new Types.ObjectId(input.deletedBy);

    const result = await ArticleModel.updateMany(
      {
        authorId: { $in: authorObjectIds },
        status: ArticleStatuses.PENDING_DELETE,
        deletedByRole: 'admin',
        deletedBy: null,
      },
      {
        deletedByRole: 'author',
        deletedBy,
        deleteScheduledAt: input.deleteScheduledAt ?? null,
        restoreRequestedAt: null,
        restoreRequestedMessage: null,
      }
    ).exec();

    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async isSlugExists(input: { authorId: string; slug: string; excludeId?: string }): Promise<boolean> {
    const query: Record<string, unknown> = {
      authorId: new Types.ObjectId(input.authorId),
      slug: input.slug,
    };
    if (input.excludeId) query._id = { $ne: new Types.ObjectId(input.excludeId) };
    const exists = await ArticleModel.exists(query);
    return exists !== null;
  },

  async incrementViews(id: string, by: number): Promise<void> {
    await ArticleModel.updateOne({ _id: new Types.ObjectId(id) }, { $inc: { views: by } }).exec();
  },

  async removeTagFromAllArticles(tagSlug: string): Promise<number> {
    const result = await ArticleModel.updateMany({ tags: tagSlug }, { $pull: { tags: tagSlug } }).exec();
    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async replaceTagSlug(oldSlug: string, newSlug: string): Promise<number> {
    if (oldSlug === newSlug) return 0;
    const result = await ArticleModel.updateMany(
      { tags: oldSlug },
      { $set: { 'tags.$[elem]': newSlug } },
      { arrayFilters: [{ elem: oldSlug }] }
    ).exec();
    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async removeCategoryFromAllArticles(categoryId: string): Promise<number> {
    const result = await ArticleModel.updateMany(
      { categoryId: new Types.ObjectId(categoryId) },
      { $set: { categoryId: null } }
    ).exec();
    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async removeCategoriesFromAllArticles(categoryIds: string[]): Promise<number> {
    if (categoryIds.length === 0) return 0;
 
    const objectIds = categoryIds.map(id => new Types.ObjectId(id));
    const result = await ArticleModel.updateMany({ categoryId: { $in: objectIds } }, { $set: { categoryId: null } }).exec();
    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async aggregateStatsByCategoryIds(
    categoryIds: string[]
  ): Promise<Record<string, { articleCount: number; views: number }>> {
    const ids = categoryIds.map(String).filter(Boolean);
    if (ids.length === 0) return {};

    const objectIds = ids.map(id => new Types.ObjectId(id));
    const rows = await ArticleModel.aggregate([
      { $match: { categoryId: { $in: objectIds } } },
      {
        $group: {
          _id: '$categoryId',
          articleCount: { $sum: 1 },
          views: { $sum: { $ifNull: ['$views', 0] } },
        },
      },
    ]).exec();

    const map: Record<string, { articleCount: number; views: number }> = {};
    for (const row of rows as any[]) {
      const id = String(row?._id ?? '');
      if (!id) continue;
      map[id] = {
        articleCount: Number(row?.articleCount ?? 0),
        views: Number(row?.views ?? 0),
      };
    }
    return map;
  },

  async listPublishedTagCounts(input: {
    authorIds: string[];
    tagSlugs?: string[];
    skip: number;
    limit: number;
  }): Promise<{ items: Array<{ slug: string; count: number }>; total: number }> {
    if (input.authorIds.length === 0) return { items: [], total: 0 };

    const authorObjectIds = input.authorIds.map(id => new Types.ObjectId(id));
    const tagSlugs = (input.tagSlugs ?? []).map(slug => slug.trim()).filter(Boolean);

    const matchStage: Record<string, unknown> = {
      status: ArticleStatuses.PUBLISHED,
      authorId: { $in: authorObjectIds },
    };
    if (tagSlugs.length > 0) {
      matchStage.tags = { $in: tagSlugs };
    }

    const [result] = await ArticleModel.aggregate([
      { $match: matchStage },
      { $unwind: '$tags' },
      ...(tagSlugs.length > 0 ? [{ $match: { tags: { $in: tagSlugs } } }] : []),
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      {
        $facet: {
          items: [{ $skip: Math.max(0, input.skip) }, { $limit: Math.max(0, input.limit) }],
          total: [{ $count: 'value' }],
        },
      },
    ]).exec();

    const items = ((result?.items ?? []) as Array<{ _id: string; count: number }>).map(item => ({
      slug: item._id,
      count: item.count,
    }));

    const total = Number(((result?.total ?? [])[0] as any)?.value ?? 0);
    return { items, total };
  },

  async listPublishedCategoryCounts(input: {
    authorIds: string[];
    categoryIds: string[];
    skip: number;
    limit: number;
  }): Promise<{ items: Array<{ categoryId: string; count: number }>; total: number }> {
    if (input.authorIds.length === 0) return { items: [], total: 0 };
    if (input.categoryIds.length === 0) return { items: [], total: 0 };

    const authorObjectIds = input.authorIds.map(id => new Types.ObjectId(id));
    const categoryObjectIds = input.categoryIds.map(id => new Types.ObjectId(id));

    const [result] = await ArticleModel.aggregate([
      {
        $match: {
          status: ArticleStatuses.PUBLISHED,
          authorId: { $in: authorObjectIds },
          categoryId: { $in: categoryObjectIds },
        },
      },
      { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      {
        $facet: {
          items: [{ $skip: Math.max(0, input.skip) }, { $limit: Math.max(0, input.limit) }],
          total: [{ $count: 'value' }],
        },
      },
    ]).exec();

    const items = ((result?.items ?? []) as Array<{ _id: Types.ObjectId; count: number }>).map(item => ({
      categoryId: String(item._id),
      count: item.count,
    }));

    const total = Number(((result?.total ?? [])[0] as any)?.value ?? 0);
    return { items, total };
  },
};
