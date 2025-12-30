import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { CategoryStatuses } from '../interfaces/Category';
import { ArticleStatuses, type ArticleStatus } from '../interfaces/Article';
import { AuthorTagService } from './AuthorTagService';
import { FrontendContentSyncService } from './FrontendContentSyncService';
import { createSlug } from '../utils/slug';
import { renderMarkdownWithToc } from '../utils/markdown';
import { SystemConfigService } from './SystemConfigService';

const DEFAULT_DELETE_GRACE_DAYS = 7;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type NormalizedTag = { name: string; slug: string };

function normalizeTagInputs(input: unknown): NormalizedTag[] {
  if (!Array.isArray(input)) return [];

  const normalized = new Map<string, string>();
  for (const value of input) {
    const name = String(value).trim();
    if (!name) continue;

    const slug = createSlug(name);
    if (!slug) {
      throw { status: 400, code: 'INVALID_TAG', message: `Invalid tag: ${name}` };
    }

    if (!normalized.has(slug)) normalized.set(slug, name);
  }

  return Array.from(normalized.entries())
    .slice(0, 30)
    .map(([slug, name]) => ({ name, slug }));
}

function toAuthorListDto(article: any) {
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
    deletedAt: article.deletedAt ?? null,
    deletedByRole: article.deletedByRole ?? null,
    deletedBy: article.deletedBy ? String(article.deletedBy) : null,
    deleteScheduledAt: article.deleteScheduledAt ?? null,
    deleteReason: article.deleteReason ?? null,
    restoreRequestedAt: article.restoreRequestedAt ?? null,
    restoreRequestedMessage: article.restoreRequestedMessage ?? null,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

function toAuthorDetailDto(article: any, content: any) {
  return {
    ...toAuthorListDto(article),
    content: {
      markdown: content?.markdown ?? '',
      html: content?.html ?? null,
      toc: content?.toc ?? [],
      renderedAt: content?.renderedAt ?? null,
      updatedAt: content?.updatedAt ?? null,
    },
  };
}

async function ensureCategoryOwnedByAuthor(input: { userId: string; categoryId: string }) {
  if (!Types.ObjectId.isValid(input.categoryId)) {
    throw { status: 400, code: 'INVALID_CATEGORY_ID', message: 'Invalid category id' };
  }

  const category = await CategoryRepository.findByIdForOwner(input.categoryId, input.userId);
  if (!category) {
    throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
  }
  if (category.status !== CategoryStatuses.ACTIVE) {
    throw { status: 409, code: 'CATEGORY_NOT_ACTIVE', message: 'Category is not active' };
  }
}

async function generateUniqueSlug(input: { authorId: string; title: string; excludeId?: string }) {
  const base = createSlug(input.title);
  if (!base) throw { status: 400, code: 'INVALID_TITLE', message: 'Invalid title' };

  let slug = base;
  let counter = 1;
  while (
    await ArticleRepository.isSlugExists(
      input.excludeId ? { authorId: input.authorId, slug, excludeId: input.excludeId } : { authorId: input.authorId, slug }
    )
  ) {
    slug = `${base}-${counter}`;
    counter++;
  }
  return slug;
}

async function getContentOrThrow(articleId: string) {
  const content = await ArticleRepository.findContentByArticleId(articleId);
  if (!content) {
    throw { status: 500, code: 'CONTENT_MISSING', message: 'Article content missing' };
  }
  return content;
}

export const AuthorArticleService = {
  async list(input: {
    userId: string;
    page: number;
    pageSize: number;
    status?: ArticleStatus;
    q?: string;
    categoryId?: string;
  }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (input.status) filter.status = input.status;
    if (input.categoryId) {
      if (!Types.ObjectId.isValid(input.categoryId)) {
        throw { status: 400, code: 'INVALID_CATEGORY_ID', message: 'Invalid category id' };
      }
      filter.categoryId = new Types.ObjectId(input.categoryId);
    }
    if (input.q && input.q.trim()) {
      filter.title = { $regex: escapeRegex(input.q.trim()), $options: 'i' };
    }

    const [total, items] = await Promise.all([
      ArticleRepository.countForAuthor(input.userId, filter),
      ArticleRepository.listForAuthor(input.userId, filter, {
        skip,
        limit: pageSize,
        sort: { updatedAt: -1 },
      }),
    ]);

    return { items: items.map(toAuthorListDto), total, page, pageSize };
  },

  async detail(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const content = await getContentOrThrow(input.id);
    return toAuthorDetailDto(article, content);
  },

  async create(input: {
    userId: string;
    title: string;
    markdown: string;
    summary?: string | null;
    coverImageUrl?: string | null;
    tags?: unknown;
    categoryId?: string | null;
  }) {
    const title = String(input.title ?? '').trim();
    if (!title) throw { status: 400, code: 'TITLE_REQUIRED', message: 'Title is required' };

    const markdown = String(input.markdown ?? '');
    if (!markdown.trim()) {
      throw { status: 400, code: 'MARKDOWN_REQUIRED', message: 'Markdown content is required' };
    }

    if (input.categoryId) {
      await ensureCategoryOwnedByAuthor({ userId: input.userId, categoryId: input.categoryId });
    }

    const tagInputs = normalizeTagInputs(input.tags);
    await AuthorTagService.ensureTagsExist({ userId: input.userId, tags: tagInputs });

    const slug = await generateUniqueSlug({ authorId: input.userId, title });

    const article = await ArticleRepository.createMeta({
      authorId: input.userId,
      title,
      slug,
      summary: input.summary ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      tags: tagInputs.map(t => t.slug),
      categoryId: input.categoryId ?? null,
      status: ArticleStatuses.DRAFT,
    });

    try {
      await ArticleRepository.createContent({
        articleId: String(article._id),
        markdown,
        html: null,
        toc: [],
        renderedAt: null,
        renderer: null,
      });
    } catch (err) {
      // Best-effort rollback: avoid leaving orphan meta when content creation fails.
      await ArticleRepository.deleteHardById(String(article._id));
      throw err;
    }

    const content = await getContentOrThrow(String(article._id));
    return toAuthorDetailDto(article, content);
  },

  async update(input: {
    userId: string;
    id: string;
    title?: string;
    markdown?: string;
    summary?: string | null;
    coverImageUrl?: string | null;
    tags?: unknown;
    categoryId?: string | null;
  }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const existing = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (existing.status === ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'ARTICLE_DELETED', message: 'Article is pending deletion' };
    }

    const wasPublished = existing.status === ArticleStatuses.PUBLISHED;
    const updateMeta: Record<string, unknown> = {};
    const updateContent: Record<string, unknown> = {};
    if (wasPublished) {
      updateMeta.status = ArticleStatuses.EDITING;
    }

    if (input.title !== undefined) {
      const title = String(input.title).trim();
      if (!title) throw { status: 400, code: 'INVALID_TITLE', message: 'Invalid title' };
      if (title !== existing.title) {
        updateMeta.title = title;
        // Only regenerate slug before the first publish to keep public URLs stable.
        if (!existing.firstPublishedAt) {
          updateMeta.slug = await generateUniqueSlug({
            authorId: input.userId,
            title,
            excludeId: input.id,
          });
        }
      }
    }

    if (input.summary !== undefined) {
      updateMeta.summary = input.summary === null ? null : String(input.summary).trim();
    }

    if (input.coverImageUrl !== undefined) {
      updateMeta.coverImageUrl = input.coverImageUrl === null ? null : String(input.coverImageUrl).trim();
    }

    if (input.tags !== undefined) {
      const tagInputs = normalizeTagInputs(input.tags);
      await AuthorTagService.ensureTagsExist({ userId: input.userId, tags: tagInputs });
      updateMeta.tags = tagInputs.map(t => t.slug);
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId === null) {
        updateMeta.categoryId = null;
      } else {
        await ensureCategoryOwnedByAuthor({ userId: input.userId, categoryId: input.categoryId });
        updateMeta.categoryId = new Types.ObjectId(input.categoryId);
      }
    }

    if (input.markdown !== undefined) {
      const markdown = String(input.markdown);
      if (!markdown.trim()) {
        throw { status: 400, code: 'INVALID_MARKDOWN', message: 'Invalid markdown' };
      }

      updateContent.markdown = markdown;
      // Clear rendered output while editing; it will be re-rendered on publish.
      updateContent.html = null;
      updateContent.toc = [];
      updateContent.renderedAt = null;
      updateContent.renderer = null;
    }

    const [updatedMeta, updatedContent] = await Promise.all([
      Object.keys(updateMeta).length > 0
        ? ArticleRepository.updateMetaForAuthor(input.id, input.userId, updateMeta)
        : existing,
      Object.keys(updateContent).length > 0
        ? ArticleRepository.updateContentByArticleId(input.id, updateContent)
        : ArticleRepository.findContentByArticleId(input.id),
    ]);

    if (!updatedMeta) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    if (!updatedContent) {
      throw { status: 500, code: 'CONTENT_MISSING', message: 'Article content missing' };
    }
    if (wasPublished) {
      await FrontendContentSyncService.syncArticleById(input.id);
    }
    return toAuthorDetailDto(updatedMeta, updatedContent);
  },

  async unpublish(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const existing = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (existing.status !== ArticleStatuses.PUBLISHED) {
      throw { status: 409, code: 'NOT_PUBLISHED', message: 'Article is not published' };
    }

    const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, {
      status: ArticleStatuses.EDITING,
    });
    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const content = await getContentOrThrow(input.id);
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAuthorDetailDto(updated, content);
  },

  async publish(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status !== ArticleStatuses.DRAFT && article.status !== ArticleStatuses.EDITING) {
      throw { status: 409, code: 'NOT_PUBLISHABLE', message: 'Article is not publishable' };
    }

    const content = await ArticleRepository.findContentByArticleId(input.id);
    if (!content) throw { status: 500, code: 'CONTENT_MISSING', message: 'Article content missing' };

    const markdown = String((content as any).markdown ?? '');
    if (!markdown.trim()) {
      throw { status: 400, code: 'MARKDOWN_REQUIRED', message: 'Markdown content is required' };
    }

    const { frontend } = await SystemConfigService.get();
    const { html, toc, renderer } = await renderMarkdownWithToc(markdown, {
      themes: frontend.themes?.include,
    });
    const now = new Date();

    await ArticleRepository.updateContentByArticleId(input.id, {
      html,
      toc,
      renderedAt: now,
      renderer,
    });

    const updateMeta: Record<string, unknown> = {
      status: ArticleStatuses.PUBLISHED,
      publishedAt: now,
      deletedAt: null,
      deletedByRole: null,
      deletedBy: null,
      deleteScheduledAt: null,
      deleteReason: null,
      restoreRequestedAt: null,
      restoreRequestedMessage: null,
    };
    if (!article.firstPublishedAt) updateMeta.firstPublishedAt = now;

    const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, updateMeta);
    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const updatedContent = await getContentOrThrow(input.id);
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAuthorDetailDto(updated, updatedContent);
  },

  async saveDraft(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const existing = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    if (existing.status !== ArticleStatuses.EDITING) {
      throw { status: 409, code: 'NOT_EDITING', message: 'Article is not in editing state' };
    }

    const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, {
      status: ArticleStatuses.DRAFT,
    });
    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    const content = await getContentOrThrow(input.id);
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAuthorDetailDto(updated, content);
  },

  async remove(input: { userId: string; id: string; graceDays?: number; reason?: string | null }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status === ArticleStatuses.PENDING_DELETE) {
      return {
        id: input.id,
        status: article.status,
        deleteScheduledAt: article.deleteScheduledAt ?? null,
        deletedByRole: article.deletedByRole ?? null,
      };
    }

    if (article.status === ArticleStatuses.PUBLISHED) {
      const graceDays =
        input.graceDays === undefined
          ? DEFAULT_DELETE_GRACE_DAYS
          : Math.max(1, Math.min(30, Math.floor(input.graceDays)));
      const deleteScheduledAt = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);

      const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, {
        status: ArticleStatuses.PENDING_DELETE,
        preDeleteStatus: (article as any).preDeleteStatus ?? article.status,
        deletedAt: new Date(),
        deletedByRole: 'author',
        deletedBy: new Types.ObjectId(input.userId),
        deleteScheduledAt,
        deleteReason: input.reason?.trim() ? input.reason.trim() : null,
        restoreRequestedAt: null,
        restoreRequestedMessage: null,
      });

      if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
      await FrontendContentSyncService.syncArticleById(input.id);
      return {
        id: input.id,
        status: updated.status,
        deleteScheduledAt: updated.deleteScheduledAt ?? null,
        deletedByRole: updated.deletedByRole ?? null,
      };
    }

    // DRAFT / EDITING: hard delete immediately.
    const deleted = await ArticleRepository.deleteHardForAuthor(input.id, input.userId);
    if (!deleted) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    await FrontendContentSyncService.syncArticleById(input.id);
    return { id: input.id, deleted: true, deletedAt: new Date().toISOString() };
  },

  async restore(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status !== ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Article is not pending deletion' };
    }

    if (article.deletedByRole === 'admin') {
      throw {
        status: 403,
        code: 'ADMIN_DELETE_REQUIRES_RESTORE_REQUEST',
        message: 'Admin-deleted article requires a restore request',
      };
    }

    const nextStatus =
      (article as any).preDeleteStatus && (article as any).preDeleteStatus !== ArticleStatuses.PENDING_DELETE
        ? (article as any).preDeleteStatus
        : ArticleStatuses.PUBLISHED;
    const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, {
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

    const content = await getContentOrThrow(input.id);
    await FrontendContentSyncService.syncArticleById(input.id);
    return toAuthorDetailDto(updated, content);
  },

  async requestRestore(input: { userId: string; id: string; message?: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status !== ArticleStatuses.PENDING_DELETE || article.deletedByRole !== 'admin') {
      throw {
        status: 409,
        code: 'NOT_ADMIN_DELETED',
        message: 'Only admin-deleted articles can be requested for restore',
      };
    }

    if (article.restoreRequestedAt) {
      return {
        id: input.id,
        requestedAt: article.restoreRequestedAt,
        message: article.restoreRequestedMessage ?? null,
      };
    }

    const message = input.message?.trim() ? input.message.trim() : null;
    const updated = await ArticleRepository.updateMetaForAuthor(input.id, input.userId, {
      restoreRequestedAt: new Date(),
      restoreRequestedMessage: message,
    });

    if (!updated) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    return {
      id: input.id,
      requestedAt: updated.restoreRequestedAt ?? null,
      message: updated.restoreRequestedMessage ?? null,
    };
  },

  async confirmDelete(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaByIdForAuthor(input.id, input.userId);
    if (!article) throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };

    if (article.status !== ArticleStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Article is not pending deletion' };
    }
    if (article.deletedByRole === 'admin') {
      throw { status: 403, code: 'FORBIDDEN', message: 'Admin-deleted article cannot be purged by author' };
    }

    await ArticleRepository.deleteHardForAuthor(input.id, input.userId);
    await FrontendContentSyncService.syncArticleById(input.id);
    return { id: input.id, purged: true, purgedAt: new Date().toISOString() };
  },
};
