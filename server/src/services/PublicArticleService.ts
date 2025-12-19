import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { ArticleStatuses } from '../interfaces/Article';
import { renderMarkdownWithToc } from '../utils/markdown';

const VIEW_CACHE_TTL_MS = 10 * 1000;
const viewCache = new Map<string, number>();

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function addView(articleId: string, ip: string) {
  const key = `${ip}_${articleId}`;
  const now = Date.now();

  const last = viewCache.get(key);
  if (last && now - last < VIEW_CACHE_TTL_MS) return;

  viewCache.set(key, now);
  await ArticleRepository.incrementViews(articleId, 1);
}

function toPublicListDto(article: any) {
  return {
    id: String(article._id),
    authorId: String(article.authorId),
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? null,
    coverImageUrl: article.coverImageUrl ?? null,
    tags: article.tags ?? [],
    categoryId: article.categoryId ? String(article.categoryId) : null,
    firstPublishedAt: article.firstPublishedAt ?? null,
    publishedAt: article.publishedAt ?? null,
    views: article.views ?? 0,
  };
}

function toPublicDetailDto(article: any, content: any) {
  return {
    ...toPublicListDto(article),
    content: {
      html: content?.html ?? null,
      toc: content?.toc ?? [],
      renderedAt: content?.renderedAt ?? null,
    },
  };
}

export const PublicArticleService = {
  async list(input: {
    page: number;
    pageSize: number;
    authorId?: string;
    categoryId?: string;
    tag?: string;
    q?: string;
  }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(100, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = { status: ArticleStatuses.PUBLISHED };

    if (input.authorId) {
      if (!Types.ObjectId.isValid(input.authorId)) {
        throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
      }
      filter.authorId = new Types.ObjectId(input.authorId);
    }

    if (input.categoryId) {
      if (!Types.ObjectId.isValid(input.categoryId)) {
        throw { status: 400, code: 'INVALID_CATEGORY_ID', message: 'Invalid category id' };
      }
      filter.categoryId = new Types.ObjectId(input.categoryId);
    }

    if (input.tag && input.tag.trim()) {
      filter.tags = input.tag.trim();
    }

    if (input.q && input.q.trim()) {
      filter.title = { $regex: escapeRegex(input.q.trim()), $options: 'i' };
    }

    const [total, items] = await Promise.all([
      ArticleRepository.count(filter),
      ArticleRepository.list(filter, { skip, limit: pageSize, sort: { publishedAt: -1 } }),
    ]);

    return { items: items.map(toPublicListDto), total, page, pageSize };
  },

  async detailById(input: { id: string; ip?: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(input.id);
    if (!article || article.status !== ArticleStatuses.PUBLISHED) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const content = await ArticleRepository.findContentByArticleId(input.id);
    if (!content) throw { status: 404, code: 'CONTENT_NOT_FOUND', message: 'Article content not found' };

    // Render-on-demand fallback (e.g. older drafts published before we persisted HTML).
    if (!content.html) {
      const { html, toc } = renderMarkdownWithToc(content.markdown);
      await ArticleRepository.updateContentByArticleId(input.id, {
        html,
        toc,
        renderedAt: new Date(),
      });
    }

    if (input.ip) {
      await addView(input.id, input.ip);
    }

    const updatedContent = await ArticleRepository.findContentByArticleId(input.id);
    return toPublicDetailDto(article, updatedContent);
  },

  async detailBySlug(input: { authorId: string; slug: string; ip?: string }) {
    if (!Types.ObjectId.isValid(input.authorId)) {
      throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
    }

    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!slug) throw { status: 400, code: 'SLUG_REQUIRED', message: 'Slug is required' };

    const article = await ArticleRepository.findMetaBySlugForAuthor(input.authorId, slug);
    if (!article || article.status !== ArticleStatuses.PUBLISHED) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const id = String(article._id);
    return input.ip ? PublicArticleService.detailById({ id, ip: input.ip }) : PublicArticleService.detailById({ id });
  },
};
