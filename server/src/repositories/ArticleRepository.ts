import { Types } from 'mongoose';
import { ArticleModel, type ArticleDocument } from '../models/ArticleModel';
import { ArticleContentModel, type ArticleContentDocument } from '../models/ArticleContentModel';
import type { TocItem } from '../interfaces/Article';

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
  }): Promise<ArticleContentDocument> {
    const content = new ArticleContentModel({
      articleId: new Types.ObjectId(data.articleId),
      markdown: data.markdown,
      html: data.html ?? null,
      toc: data.toc ?? [],
      renderedAt: data.renderedAt ?? null,
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
};
