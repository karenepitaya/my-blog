import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { ArticleStatuses, type ArticleStatus } from '../interfaces/Article';
import type { ArticleDocument } from '../models/ArticleModel';
import { FrontendContentSyncService } from './FrontendContentSyncService';
import { getRecycleBinRetentionDays } from './RecycleBinPolicyService';
import { escapeRegex } from '../utils/regex';

function toAdminDto(article: ArticleDocument) {
  return {
    id: String(article._id),
    authorId: String(article.authorId),
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? null,
    coverImageUrl: article.coverImageUrl ?? null,
    tags: article.tags ?? [],
    categoryId: article.categoryId ? String(article.categoryId) : null,
    status: article.status,
    firstPublishedAt: article.firstPublishedAt ?? null,
    publishedAt: article.publishedAt ?? null,
    views: article.views ?? 0,
    likesCount: article.likesCount ?? 0,
    deletedAt: article.deletedAt ?? null,
    deletedByRole: article.deletedByRole ?? null,
    deletedBy: article.deletedBy ? String(article.deletedBy) : null,
    deleteScheduledAt: article.deleteScheduledAt ?? null,
    deleteReason: article.deleteReason ?? null,
    restoreRequestedAt: article.restoreRequestedAt ?? null,
    restoreRequestedMessage: article.restoreRequestedMessage ?? null,
    adminRemark: article.adminRemark ?? null,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

export const AdminArticleService = {
  async list(input: {
    page: number;
    pageSize: number;
    status?: ArticleStatus;
    authorId?: string;
    q?: string;
  }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (input.status) filter.status = input.status;

    if (input.authorId) {
      if (!Types.ObjectId.isValid(input.authorId)) {
        throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
      }
      filter.authorId = new Types.ObjectId(input.authorId);
    }

    if (input.q && input.q.trim()) {
      filter.title = { $regex: escapeRegex(input.q.trim()), $options: 'i' };
    }

    const [total, items] = await Promise.all([
      ArticleRepository.count(filter),
      ArticleRepository.list(filter, { skip, limit: pageSize, sort: { updatedAt: -1 } }),
    ]);

    return { items: items.map(toAdminDto), total, page, pageSize };
  },

  async detail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const content = await ArticleRepository.findContentByArticleId(id);
    return { ...toAdminDto(article), content: content ? { markdown: content.markdown } : null };
  },

  async unpublishToDraft(input: { actorId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(input.id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status === ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_EDITABLE', message: 'Article is pending deletion' };
    }

    if (article.status === ArticleStatuses.DRAFT) {
      return toAdminDto(article);
    }

    const updated = await ArticleRepository.updateMetaById(input.id, {
      status: ArticleStatuses.DRAFT,
    });

    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAdminDto(updated);
  },

  async scheduleDelete(input: {
    actorId: string;
    id: string;
    graceDays?: number;
    reason?: string | null;
  }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(input.id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status === ArticleStatuses.PENDING_DELETE) {
      return toAdminDto(article);
    }

    if (article.status !== ArticleStatuses.PUBLISHED) {
      // For non-published content, delete immediately to reduce data retention.
      await ArticleRepository.deleteHardById(input.id);
      await FrontendContentSyncService.syncArticleById(input.id);
      return { id: input.id, deleted: true, deletedAt: new Date().toISOString() };
    }

    const graceDays = await getRecycleBinRetentionDays();

    const deleteScheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

    const updated = await ArticleRepository.updateMetaById(input.id, {
      status: ArticleStatuses.PENDING_DELETE,
      preDeleteStatus: article.preDeleteStatus ?? article.status,
      deletedAt: new Date(),
      deletedByRole: 'admin',
      deletedBy: new Types.ObjectId(input.actorId),
      deleteScheduledAt,
      deleteReason: input.reason?.trim() ? input.reason.trim() : null,
      restoreRequestedAt: null,
      restoreRequestedMessage: null,
    });

    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAdminDto(updated);
  },

  async restore(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    if (article.status !== ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Article is not pending deletion' };
    }

    const nextStatus =
      article.preDeleteStatus && article.preDeleteStatus !== ArticleStatuses.PENDING_DELETE
        ? article.preDeleteStatus
        : ArticleStatuses.PUBLISHED;
    const updated = await ArticleRepository.updateMetaById(id, {
      status: nextStatus,
      preDeleteStatus: null,
      deletedAt: null,
      deletedByRole: null,
      deletedBy: null,
      deleteScheduledAt: null,
      deleteReason: null,
      restoreRequestedAt: null,
      restoreRequestedMessage: null,
    });
    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    await FrontendContentSyncService.syncArticleById(id);
    return toAdminDto(updated);
  },

  async purge(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    if (article.status !== ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Article is not pending deletion' };
    }

    await ArticleRepository.deleteHardById(id);
    await FrontendContentSyncService.syncArticleById(id);
    return { id, purged: true, purgedAt: new Date().toISOString() };
  },

  async updateAdminMeta(id: string, input: { remark?: string | null }) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(id);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const update: Record<string, unknown> = {};
    if (input.remark !== undefined) {
      update.adminRemark = input.remark === null ? null : String(input.remark).trim();
    }

    const updated = await ArticleRepository.updateMetaById(id, update);
    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    return toAdminDto(updated);
  },
};
