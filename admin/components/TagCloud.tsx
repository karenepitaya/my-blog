import React, { useEffect, useMemo, useState } from 'react';
import { Article, Tag, User, UserRole } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface TagCloudProps {
  articles: Article[];
  users: User[];
  user: User;
  onLoadTags: (options?: { page?: number; pageSize?: number }) => Promise<Tag[]>;
  onCreateTag: (input: { name: string }) => Promise<Tag | null>;
  onDeleteTag: (id: string) => Promise<void>;
  onLoadDetail: (id: string) => Promise<Tag | null>;
}

const TAG_PAGE_SIZE = 200;

const TagCloud: React.FC<TagCloudProps> = ({
  articles,
  users,
  user,
  onLoadTags,
  onCreateTag,
  onDeleteTag,
  onLoadDetail,
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [detailTag, setDetailTag] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;

  const loadTags = async () => {
    setIsLoading(true);
    try {
      const data = await onLoadTags({ pageSize: TAG_PAGE_SIZE });
      setTags(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    articles.forEach(article => {
      (article.tags ?? []).forEach(tag => {
        const key = String(tag);
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });
    return map;
  }, [articles]);

  const filteredTags = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter(tag => {
      return tag.name.toLowerCase().includes(normalized) || tag.slug.toLowerCase().includes(normalized);
    });
  }, [tags, searchTerm]);

  const counts = useMemo(() => filteredTags.map(tag => usageMap.get(tag.slug) ?? 0), [filteredTags, usageMap]);
  const maxCount = Math.max(0, ...counts);
  const minCount = counts.length === 0 ? 0 : Math.min(...counts);

  const colorPalette = [
    'text-[#bd93f9] border-[#bd93f9]/30 bg-[#bd93f9]/10',
    'text-[#8be9fd] border-[#8be9fd]/30 bg-[#8be9fd]/10',
    'text-[#50fa7b] border-[#50fa7b]/30 bg-[#50fa7b]/10',
    'text-[#ffb86c] border-[#ffb86c]/30 bg-[#ffb86c]/10',
    'text-[#ff79c6] border-[#ff79c6]/30 bg-[#ff79c6]/10',
  ];

  const getSizeClass = (count: number) => {
    if (maxCount === minCount) return 'text-sm';
    const ratio = (count - minCount) / (maxCount - minCount);
    if (ratio > 0.66) return 'text-lg';
    if (ratio > 0.33) return 'text-base';
    return 'text-sm';
  };

  const getColorClass = (slug: string) => {
    let hash = 0;
    for (let i = 0; i < slug.length; i += 1) {
      hash = (hash + slug.charCodeAt(i)) % colorPalette.length;
    }
    return colorPalette[hash];
  };

  const getCreatorLabel = (createdBy?: string | null) => {
    if (!createdBy) return '系统';
    return users.find(u => u.id === createdBy)?.username || `#${createdBy.slice(0, 6)}`;
  };

  const openDetail = async (tag: Tag) => {
    if (!isAdmin) return;
    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(tag.id);
      setDetailTag(detail ?? tag);
    } catch (err) {
      alert((err as Error).message);
      setDetailTag(tag);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCreate = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setIsSubmitting(true);
    try {
      await onCreateTag({ name });
      setNewTagName('');
      await loadTags();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="标签云"
        motto={isAdmin ? '全站标签热度与清理入口。' : '维护你的标签资产并快速复用。'}
      />

      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="搜索标签名或 slug"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#21222c] border border-[#44475a] px-6 py-4 rounded-xl text-sm text-[#f8f8f2] focus:border-[#bd93f9] focus:outline-none transition-all placeholder-[#44475a] shadow-inner font-mono"
        />
        {!isAdmin && (
          <div className="flex flex-1 gap-3">
            <input
              type="text"
              placeholder="输入新标签"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              className="flex-1 bg-[#21222c] border border-[#44475a] px-5 py-3 rounded-xl text-sm text-[#f8f8f2] focus:border-[#bd93f9] focus:outline-none transition-all placeholder-[#44475a]"
            />
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/20 disabled:opacity-60"
            >
              <Icons.Plus />
              创建
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#21222c] border border-[#44475a] rounded-2xl p-8 shadow-2xl min-h-[240px]">
        {isLoading ? (
          <div className="py-16 text-center text-[#6272a4] font-mono text-xs uppercase tracking-widest animate-pulse">
            同步标签云中...
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="py-16 text-center text-[#6272a4] font-mono text-xs uppercase italic">
            暂无标签数据。
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredTags.map(tag => {
              const count = usageMap.get(tag.slug) ?? 0;
              const sizeClass = getSizeClass(count);
              const colorClass = getColorClass(tag.slug);
              return (
                <button
                  key={tag.id}
                  onClick={() => openDetail(tag)}
                  disabled={!isAdmin}
                  className={`group border rounded-full px-4 py-2 flex items-center gap-2 transition-all hover:scale-[1.02] hover:-translate-y-0.5 shadow-lg ${colorClass} disabled:opacity-100 disabled:cursor-default`}
                >
                  <span className={`font-black uppercase tracking-widest ${sizeClass}`}>#{tag.name}</span>
                  <span className="text-[9px] font-mono text-[#f8f8f2]/70">
                    {count} 篇
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {detailTag && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#44475a]">
              <div>
                <h3 className="text-lg font-black text-[#f8f8f2]">标签详情</h3>
                <p className="text-[10px] text-[#6272a4] font-mono uppercase mt-1">{detailTag.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {isLoadingDetail && (
                  <span className="text-[10px] text-[#6272a4] font-mono uppercase">同步中...</span>
                )}
                <button
                  onClick={() => setDetailTag(null)}
                  className="text-[#6272a4] hover:text-[#f8f8f2] text-xs font-black"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-lg font-black text-[#f8f8f2]">#{detailTag.name}</span>
                  <span className="text-[9px] text-[#6272a4] font-mono uppercase">/{detailTag.slug}</span>
                </div>
                <div className="text-[10px] text-[#6272a4] font-mono uppercase">
                  创建者: {getCreatorLabel(detailTag.createdBy)}
                </div>
                <div className="text-[10px] text-[#6272a4] font-mono uppercase">
                  关联文章: {usageMap.get(detailTag.slug) ?? 0} 篇
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-[10px] text-[#6272a4] font-mono uppercase">
                  创建时间: {detailTag.createdAt ? new Date(detailTag.createdAt).toLocaleDateString() : '—'}
                </div>
                <div className="text-[10px] text-[#6272a4] font-mono uppercase">
                  更新时间: {detailTag.updatedAt ? new Date(detailTag.updatedAt).toLocaleDateString() : '—'}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDetailTag(null)}
                    className="px-4 py-2 text-xs font-black text-[#6272a4] uppercase"
                  >
                    关闭
                  </button>
                  <button
                    onClick={() => setDeleteTarget(detailTag)}
                    className="px-6 py-3 bg-[#ff5545] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest"
                  >
                    删除标签
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="删除标签"
        message={`确认删除标签「${deleteTarget?.name}」？该标签会从关联文章中移除。`}
        confirmText="确认删除"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await onDeleteTag(deleteTarget.id);
            await loadTags();
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setDeleteTarget(null);
            setDetailTag(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default TagCloud;
