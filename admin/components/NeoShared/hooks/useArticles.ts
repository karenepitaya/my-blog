import { useEffect, useMemo, useState } from 'react';
import { ArticleStatus } from '../../../types';
import { useNeoAdminRuntimeOptional } from '../runtime/NeoAdminRuntimeContext';

export type NeoArticleRowStatus = 'all' | 'published' | 'draft' | 'archived';

export type NeoArticleRow = {
  id: string;
  title: string;
  author: string;
  authorId: string;
  status: Exclude<NeoArticleRowStatus, 'all'>;
  category: string;
  categoryId: string | null;
  tags: string[];
  views: number;
  date: string;
  adminRemark?: string | null;
};

export const useArticles = () => {
  const runtime = useNeoAdminRuntimeOptional();
  const [articles, setArticles] = useState<NeoArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  const authorNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of runtime?.users ?? []) map.set(u.id, u.username);
    return map;
  }, [runtime?.users]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of runtime?.categories ?? []) map.set(c.id, c.name);
    return map;
  }, [runtime?.categories]);

  useEffect(() => {
    if (!runtime) {
      setArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const mapped = (runtime.articles ?? []).map((a) => {
      const status: NeoArticleRow['status'] =
        a.status === ArticleStatus.PUBLISHED ? 'published' : a.status === ArticleStatus.PENDING_DELETE ? 'archived' : 'draft';

      const dateSource = String(a.publishedAt ?? a.createdAt ?? a.updatedAt ?? '');
      const date = dateSource ? dateSource.slice(0, 10) : new Date().toISOString().slice(0, 10);

      return {
        id: a.id,
        title: a.title,
        author: authorNameById.get(a.authorId) ?? a.authorId,
        authorId: a.authorId,
        status,
        category: a.categoryId ? (categoryNameById.get(a.categoryId) ?? a.categoryId) : '未归类',
        categoryId: a.categoryId ?? null,
        tags: Array.isArray((a as any).tags) ? (a as any).tags.map(String) : [],
        views: Number(a.views ?? 0),
        date,
        adminRemark: a.adminRemark ?? null,
      };
    });

    setArticles(mapped);
    setLoading(false);
  }, [authorNameById, categoryNameById, runtime]);

  return { articles, loading };
};

