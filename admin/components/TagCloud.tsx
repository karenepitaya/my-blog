import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserRole, type Article as AdminArticle, type Tag as AdminTag, type User } from '../types';
import TagCloudView from './TagCloud/components/TagCloud';
import type { Article as CloudArticle, Tag as CloudTag, TagCreateInput, TagUpdateInput } from './TagCloud/types';
import { DRACULA_PALETTE } from './TagCloud/types';
import PageHeader from './PageHeader';

interface TagCloudProps {
  articles: AdminArticle[];
  users: User[];
  user: User;
  frontendSiteUrl?: string;
  onLoadTags: (options?: { page?: number; pageSize?: number }) => Promise<AdminTag[]>;
  onCreateTag: (input: {
    name: string;
    color?: string | null;
    effect?: 'glow' | 'pulse' | 'none';
    description?: string | null;
  }) => Promise<AdminTag | null>;
  onDeleteTag: (id: string) => Promise<void>;
  onUpdateTag?: (
    id: string,
    input: { name?: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ) => Promise<AdminTag | null>;
  onLoadDetail: (id: string) => Promise<AdminTag | null>;
}

const TAG_PAGE_SIZE = 200;

const normalizeEffect = (effect?: string): 'glow' | 'pulse' | 'none' => {
  if (effect === 'glow' || effect === 'pulse' || effect === 'none') return effect;
  return 'none';
};

const normalizeTagName = (value?: string) => value?.trim().toLowerCase() ?? '';

const getColorForSeed = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % DRACULA_PALETTE.length;
  }
  return DRACULA_PALETTE[hash];
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
};

const normalizeSiteBase = (value?: string) => {
  if (!value) return '';
  return value.trim().replace(/\/+$/, '');
};

const buildFrontendArticleUrl = (base: string, authorUsername?: string, slug?: string) => {
  if (!authorUsername || !slug) return '';
  const path = `/posts/${encodeURIComponent(authorUsername)}/${encodeURIComponent(slug)}`;
  return base ? `${base}${path}` : path;
};

const estimateReadTime = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 1;
  const wordCount = normalized.split(' ').length;
  const charCount = normalized.replace(/\s+/g, '').length;
  const minutes = wordCount > 1 ? wordCount / 200 : charCount / 400;
  return Math.max(1, Math.round(minutes));
};

const buildExcerpt = (text: string) => {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 140)}...`;
};

const TagCloud: React.FC<TagCloudProps> = ({
  articles,
  users,
  user,
  frontendSiteUrl,
  onLoadTags,
  onCreateTag,
  onDeleteTag,
  onUpdateTag,
}) => {
  const [rawTags, setRawTags] = useState<AdminTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const canManage = user.role === UserRole.ADMIN || user.role === UserRole.AUTHOR;

  const userMap = useMemo(() => new Map(users.map(item => [item.id, item.username])), [users]);

  const articlesByTag = useMemo(() => {
    const map = new Map<string, AdminArticle[]>();
    articles.forEach(article => {
      (article.tags ?? []).forEach(tagSlug => {
        const bucket = map.get(tagSlug) ?? [];
        bucket.push(article);
        map.set(tagSlug, bucket);
      });
    });
    return map;
  }, [articles]);

  const siteBase = useMemo(() => normalizeSiteBase(frontendSiteUrl), [frontendSiteUrl]);

  const toCloudArticle = useCallback((article: AdminArticle): CloudArticle => {
    const textSource = article.summary ?? article.markdown ?? '';
    const authorUsername = userMap.get(article.authorId);
    const url = buildFrontendArticleUrl(siteBase, authorUsername, article.slug);
    return {
      id: article.id,
      title: article.title,
      excerpt: buildExcerpt(textSource),
      readTime: estimateReadTime(textSource),
      date: formatDate(article.publishedAt ?? article.createdAt ?? article.updatedAt),
      slug: article.slug,
      authorUsername,
      url: url || undefined,
    };
  }, [siteBase, userMap]);

  const toCloudTag = useCallback(
    (tag: AdminTag): CloudTag => {
      const tagArticles = articlesByTag.get(tag.slug) ?? [];
      const creator = tag.createdBy ? userMap.get(tag.createdBy) ?? `#${tag.createdBy.slice(0, 6)}` : 'System';
      return {
        id: tag.id,
        label: tag.name,
        color: tag.color ?? getColorForSeed(tag.slug || tag.id),
        creator,
        createdAt: formatDate(tag.createdAt),
        articleCount: tagArticles.length,
        description: tag.description ?? undefined,
        effect: normalizeEffect(tag.effect),
        articles: tagArticles.map(toCloudArticle),
      };
    },
    [articlesByTag, toCloudArticle, userMap]
  );

  const cloudTags = useMemo(() => rawTags.map(toCloudTag), [rawTags, toCloudTag]);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await onLoadTags({ pageSize: TAG_PAGE_SIZE });
      setRawTags(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [onLoadTags]);

  useEffect(() => {
    loadTags();
  }, [loadTags, user.id, user.role]);

  const handleCreate = async (tag: TagCreateInput) => {
    if (!canManage) return null;
    const normalizedLabel = normalizeTagName(tag.label);
    if (!normalizedLabel) {
      throw new Error('Tag name cannot be empty.');
    }
    if (rawTags.some(item => normalizeTagName(item.name) === normalizedLabel)) {
      throw new Error('Tag name already exists.');
    }
    const result = await onCreateTag({
      name: tag.label,
      color: tag.color,
      effect: tag.effect,
      description: tag.description ?? null,
    });
    await loadTags();
    return result ? toCloudTag(result) : null;
  };

  const handleUpdate = async (id: string, updates: TagUpdateInput) => {
    if (!canManage || !onUpdateTag) return null;
    const payload: {
      name?: string;
      color?: string | null;
      effect?: 'glow' | 'pulse' | 'none';
      description?: string | null;
    } = {};

    if (updates.label !== undefined) {
      const normalizedLabel = normalizeTagName(updates.label);
      if (!normalizedLabel) {
        throw new Error('Tag name cannot be empty.');
      }
      if (rawTags.some(tag => tag.id !== id && normalizeTagName(tag.name) === normalizedLabel)) {
        throw new Error('Tag name already exists.');
      }
      payload.name = updates.label;
    }
    if (updates.color !== undefined) payload.color = updates.color ?? null;
    if (updates.effect !== undefined) payload.effect = updates.effect ?? 'none';
    if (updates.description !== undefined) payload.description = updates.description ?? null;

    if (Object.keys(payload).length === 0) return null;
    const result = await onUpdateTag(id, payload);
    await loadTags();
    return result ? toCloudTag(result) : null;
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    await onDeleteTag(id);
    await loadTags();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="标签云" motto="管理标签，并查看它们关联的文章。" />

      <div className="relative h-[calc(100vh-240px)] min-h-[560px]">
        <TagCloudView
          data={cloudTags}
          onRefresh={loadTags}
          onCreate={canManage ? handleCreate : undefined}
          onUpdate={canManage ? handleUpdate : undefined}
          onDelete={canManage ? handleDelete : undefined}
          readOnly={!canManage}
        />

        {isLoading && (
          <div className="absolute inset-0 z-[65000] flex items-center justify-center bg-transparent">
            <div className="px-5 py-2 rounded-full bg-surface/70 border border-border text-secondary font-mono text-[10px] tracking-[0.22em] shadow-md">
              Loading...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagCloud;
