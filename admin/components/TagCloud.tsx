import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserRole, type Article as AdminArticle, type Tag as AdminTag, type User } from '../types';
import TagCloudView from './TagCloud/components/TagCloud';
import type { Article as CloudArticle, Tag as CloudTag } from './TagCloud/types';
import { DRACULA_PALETTE } from './TagCloud/types';
import PageHeader from './PageHeader';

interface TagCloudProps {
  articles: AdminArticle[];
  users: User[];
  user: User;
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
  onLoadTags,
  onCreateTag,
  onDeleteTag,
  onUpdateTag,
}) => {
  const [rawTags, setRawTags] = useState<AdminTag[]>([]);
  const [order, setOrder] = useState<string[] | null>(null);
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

  const toCloudArticle = useCallback((article: AdminArticle): CloudArticle => {
    const textSource = article.summary ?? article.markdown ?? '';
    return {
      id: article.id,
      title: article.title,
      excerpt: buildExcerpt(textSource),
      readTime: estimateReadTime(textSource),
      date: formatDate(article.publishedAt ?? article.createdAt ?? article.updatedAt),
    };
  }, []);

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

  const cloudTags = useMemo(() => {
    const mapped = rawTags.map(toCloudTag);
    if (!order || order.length === 0) return mapped;

    const byId = new Map(mapped.map(item => [item.id, item]));
    const ordered = order.map(id => byId.get(id)).filter(Boolean) as CloudTag[];
    const orderSet = new Set(order);
    mapped.forEach(item => {
      if (!orderSet.has(item.id)) ordered.push(item);
    });
    return ordered;
  }, [rawTags, order, toCloudTag]);

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
  }, [user.id, user.role]);

  const handleCreate = async (tag: CloudTag) => {
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

  const handleUpdate = async (id: string, updates: Partial<CloudTag>) => {
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
      <PageHeader title="Tag Cloud" motto="Manage tags and explore their related articles." />

      <div className="relative h-[calc(100vh-240px)] min-h-[560px]">
        <TagCloudView
          data={cloudTags}
          onDataChange={tags => setOrder(tags.map(item => item.id))}
          onRefresh={loadTags}
          onCreate={canManage ? handleCreate : undefined}
          onUpdate={canManage ? handleUpdate : undefined}
          onDelete={canManage ? handleDelete : undefined}
          readOnly={!canManage}
        />

        {isLoading && (
          <div className="absolute inset-0 z-[65000] flex items-center justify-center bg-[#0f111a]/20 backdrop-blur-sm">
            <div className="px-5 py-2 rounded-full bg-[#1b1f2a]/70 border border-white/10 text-[#8be9fd] font-mono text-[10px] uppercase tracking-[0.35em] shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
              Loading...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagCloud;
