import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { TagRepository } from '../repositories/TagRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ArticleStatuses } from '../interfaces/Article';
import { MARKDOWN_RENDERER_ID, renderMarkdownWithToc } from '../utils/markdown';
import { SystemConfigService } from './SystemConfigService';
import { getActiveAuthorIdsCached, isAuthorPubliclyVisible } from './PublicAuthorVisibility';

const VIEW_CACHE_TTL_MS = 10 * 1000;
const viewCache = new Map<string, number>();
const VIEW_CACHE_CLEANUP_INTERVAL_MS = 30 * 1000;
let lastViewCacheCleanupAt = 0;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function addView(articleId: string, ip: string) {
  const key = `${ip}_${articleId}`;
  const now = Date.now();

  if (now - lastViewCacheCleanupAt > VIEW_CACHE_CLEANUP_INTERVAL_MS) {
    lastViewCacheCleanupAt = now;
    for (const [cacheKey, lastSeenAt] of viewCache) {
      if (now - lastSeenAt > VIEW_CACHE_TTL_MS) viewCache.delete(cacheKey);
    }
  }

  const last = viewCache.get(key);
  if (last && now - last < VIEW_CACHE_TTL_MS) return;

  viewCache.set(key, now);
  await ArticleRepository.incrementViews(articleId, 1);
}

type PublicAuthorDto = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

type PublicCategoryDto = {
  id: string;
  name: string;
  slug: string;
};

type PublicTagDto = {
  slug: string;
  name: string;
};

async function hydrateRelationsForArticles(articles: any[]) {
  const authorIds = Array.from(
    new Set(articles.map(a => String(a.authorId)).filter(Boolean))
  );
  const categoryIds = Array.from(
    new Set(articles.map(a => (a.categoryId ? String(a.categoryId) : '')).filter(Boolean))
  );
  const tagSlugs = Array.from(
    new Set(
      articles
        .flatMap(a => (Array.isArray(a.tags) ? a.tags : []))
        .map((t: any) => String(t).trim())
        .filter(Boolean)
    )
  );

  const [authors, categories, tags] = await Promise.all([
    authorIds.length > 0
      ? UserRepository.list(
          { _id: { $in: authorIds.map(id => new Types.ObjectId(id)) }, role: 'author' },
          { skip: 0, limit: authorIds.length, sort: { username: 1 } }
        )
      : Promise.resolve([]),
    CategoryRepository.findManyByIds(categoryIds),
    TagRepository.findManyBySlugs(tagSlugs),
  ]);

  const authorById = new Map(authors.map(author => [String(author._id), author]));
  const categoryById = new Map(categories.map(category => [String((category as any)._id), category]));
  const tagBySlug = new Map(tags.map(tag => [String((tag as any).slug), tag]));

  return { authorById, categoryById, tagBySlug };
}

function toPublicListDto(article: any, relations?: Awaited<ReturnType<typeof hydrateRelationsForArticles>>) {
  const authorDoc = relations?.authorById.get(String(article.authorId));
  const categoryDoc = article.categoryId
    ? relations?.categoryById.get(String(article.categoryId))
    : undefined;

  const author: PublicAuthorDto | null = authorDoc
    ? {
        id: String((authorDoc as any)._id),
        username: String((authorDoc as any).username),
        displayName: (authorDoc as any).displayName ?? null,
        avatarUrl: (authorDoc as any).avatarUrl ?? null,
        bio: (authorDoc as any).bio ?? null,
      }
    : null;

  const category: PublicCategoryDto | null = categoryDoc
    ? {
        id: String((categoryDoc as any)._id),
        name: String((categoryDoc as any).name ?? ''),
        slug: String((categoryDoc as any).slug ?? ''),
      }
    : null;

  const tagSlugs: string[] = Array.isArray(article.tags) ? article.tags.map(String) : [];
  const tagDetails: PublicTagDto[] = tagSlugs.map(slug => {
    const tagDoc = relations?.tagBySlug.get(slug);
    return { slug, name: String((tagDoc as any)?.name ?? slug) };
  });

  return {
    id: String(article._id),
    authorId: String(article.authorId),
    author,
    title: article.title,
    slug: article.slug,
    summary: article.summary ?? null,
    coverImageUrl: article.coverImageUrl ?? null,
    tags: article.tags ?? [],
    tagDetails,
    categoryId: article.categoryId ? String(article.categoryId) : null,
    category,
    firstPublishedAt: article.firstPublishedAt ?? null,
    publishedAt: article.publishedAt ?? null,
    views: article.views ?? 0,
  };
}

function toPublicDetailDto(
  article: any,
  content: any,
  relations?: Awaited<ReturnType<typeof hydrateRelationsForArticles>>
) {
  return {
    ...toPublicListDto(article, relations),
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

      const visible = await isAuthorPubliclyVisible(input.authorId);
      if (!visible) return { items: [], total: 0, page, pageSize };

      filter.authorId = new Types.ObjectId(input.authorId);
    } else {
      const activeAuthorIds = await getActiveAuthorIdsCached();
      if (activeAuthorIds.length === 0) return { items: [], total: 0, page, pageSize };
      filter.authorId = { $in: activeAuthorIds.map(id => new Types.ObjectId(id)) };
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

    const relations = await hydrateRelationsForArticles(items as any[]);
    return { items: (items as any[]).map(item => toPublicListDto(item, relations)), total, page, pageSize };
  },

  async detailById(input: { id: string; ip?: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
    }

    const article = await ArticleRepository.findMetaById(input.id);
    if (!article || article.status !== ArticleStatuses.PUBLISHED) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const authorVisible = await isAuthorPubliclyVisible(String(article.authorId));
    if (!authorVisible) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const content = await ArticleRepository.findContentByArticleId(input.id);
    if (!content) throw { status: 404, code: 'CONTENT_NOT_FOUND', message: 'Article content not found' };

    const shouldRender = !content.html || content.renderer !== MARKDOWN_RENDERER_ID;
    if (shouldRender) {
      const { frontend } = await SystemConfigService.get();
      const { html, toc, renderer } = await renderMarkdownWithToc(content.markdown, {
        themes: frontend.themes?.include,
      });
      await ArticleRepository.updateContentByArticleId(input.id, {
        html,
        toc,
        renderedAt: new Date(),
        renderer,
      });
    }

    if (input.ip) {
      await addView(input.id, input.ip);
    }

    const updatedContent = await ArticleRepository.findContentByArticleId(input.id);
    const relations = await hydrateRelationsForArticles([article] as any[]);
    return toPublicDetailDto(article, updatedContent, relations);
  },

  async detailBySlug(input: { authorId: string; slug: string; ip?: string }) {
    if (!Types.ObjectId.isValid(input.authorId)) {
      throw { status: 400, code: 'INVALID_AUTHOR_ID', message: 'Invalid author id' };
    }

    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!slug) throw { status: 400, code: 'SLUG_REQUIRED', message: 'Slug is required' };

    const authorVisible = await isAuthorPubliclyVisible(input.authorId);
    if (!authorVisible) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const article = await ArticleRepository.findMetaBySlugForAuthor(input.authorId, slug);
    if (!article || article.status !== ArticleStatuses.PUBLISHED) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const id = String(article._id);
    return input.ip ? PublicArticleService.detailById({ id, ip: input.ip }) : PublicArticleService.detailById({ id });
  },

  async detailByAuthorUsername(input: { authorUsername: string; slug: string; ip?: string }) {
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
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    const visible = await isAuthorPubliclyVisible(String(user._id));
    if (!visible) {
      throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
    }

    return input.ip
      ? PublicArticleService.detailBySlug({ authorId: String(user._id), slug: input.slug, ip: input.ip })
      : PublicArticleService.detailBySlug({ authorId: String(user._id), slug: input.slug });
  },
};
