import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Archive, Search, Trash2, Users, CheckSquare, X, ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon } from 'lucide-react';
import { UserRole } from '../../types';
import { GlassCard } from '../NeoShared/ui/GlassCard';
import { NeonButton } from '../NeoShared/ui/NeonButton';
import { ConfirmModal } from '../NeoShared/ui/ConfirmModal';
import { useNeoToast } from '../NeoShared/ui/Toast';
import { useNeoAdminRuntime } from '../NeoShared/runtime/NeoAdminRuntimeContext';
import { CategoryCard } from './components/CategoryCard';
import { CategoryListItem } from './components/CategoryListItem';
import { CategoryOverviewCards } from './components/CategoryOverviewCards';
import { isCategoryTrashed } from './utils';
import { useDebouncedValue } from './hooks/useDebouncedValue';
import { toFriendlyNeoError } from './utils/errors';

export const AdminCategoryManager: React.FC = () => {
  const runtime = useNeoAdminRuntime();
  const toast = useNeoToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 220);
  const [filter, setFilter] = useState<'active' | 'trash'>('active');
  const [coverFilter, setCoverFilter] = useState<'all' | 'has' | 'none'>('all');
  const [sortKey, setSortKey] = useState<'updatedAt' | 'articleCount' | 'views'>('updatedAt');
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirm, setConfirm] = useState<
    | { type: 'delete' | 'restore' | 'purge'; id: string }
    | { type: null; id: null }
  >({ type: null, id: null });
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<{ type: 'restore' | 'purge' } | null>(null);

  const params = new URLSearchParams(location.search);
  const selectedOwnerId = params.get('ownerId') || '';

  const authors = useMemo(
    () => runtime.users.filter((u) => u.role === UserRole.AUTHOR),
    [runtime.users]
  );

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of runtime.users) map.set(u.id, u.username);
    return map;
  }, [runtime.users]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter, coverFilter, pageSize, sortKey, selectedOwnerId]);

  useEffect(() => {
    if (filter !== 'trash') {
      setBulkMode(false);
      setSelectedIds(new Set());
    }
  }, [filter]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return runtime.categories
      .filter((c) => {
        if (selectedOwnerId && String(c.ownerId ?? '') !== selectedOwnerId) return false;
        const trashed = isCategoryTrashed(c.status);
        if (filter === 'trash' && !trashed) return false;
        if (filter === 'active' && trashed) return false;
        if (coverFilter === 'has' && !String(c.coverImageUrl ?? '').trim()) return false;
        if (coverFilter === 'none' && String(c.coverImageUrl ?? '').trim()) return false;
        if (!term) return true;
        return (
          String(c.name ?? '').toLowerCase().includes(term) ||
          String(c.slug ?? '').toLowerCase().includes(term) ||
          String(c.id ?? '').toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortKey === 'articleCount') return Number(b.articleCount ?? 0) - Number(a.articleCount ?? 0);
        if (sortKey === 'views') return Number(b.views ?? 0) - Number(a.views ?? 0);
        const av = String(a.updatedAt ?? a.createdAt ?? '');
        const bv = String(b.updatedAt ?? b.createdAt ?? '');
        return bv.localeCompare(av);
      });
  }, [coverFilter, debouncedSearch, filter, runtime.categories, selectedOwnerId, sortKey]);

  const scopedCategories = useMemo(
    () => runtime.categories.filter((c) => (!selectedOwnerId ? true : String(c.ownerId ?? '') === selectedOwnerId)),
    [runtime.categories, selectedOwnerId]
  );

  const overview = useMemo(() => {
    const active = scopedCategories.filter((c) => !isCategoryTrashed(c.status));
    return {
      activeCount: active.length,
      totalLikes: active.reduce((sum, c) => sum + Number(c.likes ?? 0), 0),
    };
  }, [scopedCategories]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize))), [filtered.length, pageSize]);
  const clampedPage = Math.min(totalPages, Math.max(1, page));
  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [clampedPage, filtered, pageSize]);

  const openConfirm = (type: 'delete' | 'restore' | 'purge', id: string) => setConfirm({ type, id });

  const runAction = async () => {
    if (!confirm.type || !confirm.id) return;
    if (workingId) return;
    setWorkingId(confirm.id);
    try {
      if (confirm.type === 'delete') {
        await runtime.deleteCategory(confirm.id);
        toast.warning('已移入回收站');
      } else if (confirm.type === 'restore') {
        await runtime.restoreCategory(confirm.id);
        toast.success('已恢复');
      } else {
        await runtime.purgeCategory(confirm.id);
        toast.success('已彻底删除');
      }
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setWorkingId(null);
      setConfirm({ type: null, id: null });
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (type: 'restore' | 'purge') => {
    if (bulkWorking) return;
    const ids = Array.from(selectedIds) as string[];
    if (ids.length === 0) return;
    setBulkWorking(true);
    try {
      for (const id of ids) {
        if (type === 'restore') await runtime.restoreCategory(id);
        else await runtime.purgeCategory(id);
      }
      toast.success(type === 'restore' ? '已批量恢复' : '已批量删除');
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setBulkWorking(false);
    }
  };

  const filterButtons = [
    { id: 'active' as const, label: '全部专栏', icon: Archive },
    { id: 'trash' as const, label: '回收站', icon: Trash2 },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-white tracking-tight">
            分类专栏 (Admin)
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            管理全站专栏：作者筛选、回收站与管理员侧删除/恢复/彻底删除。
          </p>
        </div>

        <CategoryOverviewCards activeCount={overview.activeCount} totalLikes={overview.totalLikes} />
      </div>

      <GlassCard className="p-4 sticky top-2 z-30 bg-[#1a1b26]/60">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-[360px] group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="搜索 name / slug / id"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0B0C15] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder-slate-600 shadow-inner font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-secondary shrink-0" />
              <select
                value={selectedOwnerId}
                onChange={(e) => {
                  const next = e.target.value;
                  const nextParams = new URLSearchParams(location.search);
                  if (!next) nextParams.delete('ownerId');
                  else nextParams.set('ownerId', next);
                  const search = nextParams.toString();
                  navigate(`/admin/categories${search ? `?${search}` : ''}`);
                }}
                className="bg-[#0B0C15] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none hover:bg-white/5 min-w-[180px]"
                title="作者筛选"
              >
                <option value="" className="bg-[#0B0C15] text-slate-200">
                  全部作者
                </option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#0B0C15] text-slate-200">
                    @{a.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex bg-[#0B0C15] p-1 rounded-lg border border-white/10 shadow-sm gap-1">
              {filterButtons.map((f) => {
                const Icon = f.icon;
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                      active
                        ? f.id === 'trash'
                          ? 'bg-red-500/20 text-red-400 shadow-sm ring-1 ring-red-500/30'
                          : 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                        : f.id === 'trash'
                          ? 'text-slate-500 hover:text-red-400 hover:bg-white/5'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                    }`}
                    title={f.label}
                  >
                    <Icon size={14} />
                    {f.id === 'trash' ? null : f.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
                className="bg-[#0B0C15] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none hover:bg-white/5"
                title="排序"
              >
                <option value="updatedAt" className="bg-[#0B0C15] text-slate-200">
                  更新时间
                </option>
                <option value="articleCount" className="bg-[#0B0C15] text-slate-200">
                  文章数
                </option>
                <option value="views" className="bg-[#0B0C15] text-slate-200">
                  浏览
                </option>
              </select>

              <select
                value={coverFilter}
                onChange={(e) => setCoverFilter(e.target.value as any)}
                className="bg-[#0B0C15] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none hover:bg-white/5"
                title="封面筛选"
              >
                <option value="all" className="bg-[#0B0C15] text-slate-200">
                  封面：全部
                </option>
                <option value="has" className="bg-[#0B0C15] text-slate-200">
                  封面：有
                </option>
                <option value="none" className="bg-[#0B0C15] text-slate-200">
                  封面：无
                </option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#0B0C15] border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none hover:bg-white/5"
                title="每页数量"
              >
                {[12, 24, 48].map((n) => (
                  <option key={n} value={n} className="bg-[#0B0C15] text-slate-200">
                    {n}/页
                  </option>
                ))}
              </select>

              <div className="text-xs text-slate-500 font-mono whitespace-nowrap">
                {filtered.length} / {runtime.categories.length}
              </div>

              <div className="flex bg-[#0B0C15] p-1 rounded-lg border border-white/10 shadow-sm gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-2 py-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                  title="网格视图"
                  aria-label="网格视图"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-2 py-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                  title="列表视图"
                  aria-label="列表视图"
                >
                  <ListIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="text-center text-slate-500 py-16">暂无数据</GlassCard>
      ) : (
        <>
          {filter === 'trash' && (
            <GlassCard className="p-4">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-bold">
                  <Trash2 size={16} className="text-red-400" />
                  <span>回收站</span>
                  <span className="text-xs text-slate-500 font-mono">（支持批量恢复/彻底删除）</span>
                </div>
                <div className="flex items-center gap-2">
                  <NeonButton
                    variant={bulkMode ? 'primary' : 'ghost'}
                    icon={<CheckSquare size={16} />}
                    onClick={() => setBulkMode(prev => !prev)}
                    disabled={bulkWorking}
                  >
                    批量操作
                  </NeonButton>
                  {bulkMode && (
                    <NeonButton
                      variant="ghost"
                      icon={<X size={16} />}
                      onClick={() => setSelectedIds(new Set())}
                      disabled={bulkWorking}
                    >
                      清空选择
                    </NeonButton>
                  )}
                </div>
              </div>

              {bulkMode && selectedIds.size > 0 && (
                <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="text-xs text-slate-500 font-mono">已选择 {selectedIds.size} 个</div>
                  <div className="flex items-center gap-2">
                    <NeonButton
                      variant="success"
                      onClick={() => setBulkConfirm({ type: 'restore' })}
                      disabled={bulkWorking}
                    >
                      批量恢复
                    </NeonButton>
                    <NeonButton
                      variant="danger"
                      onClick={() => setBulkConfirm({ type: 'purge' })}
                      disabled={bulkWorking}
                    >
                      批量删除
                    </NeonButton>
                  </div>
                </div>
              )}
            </GlassCard>
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {pageItems.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  mode="admin"
                  ownerLabel={cat.ownerId ? `@${ownerNameById.get(String(cat.ownerId)) ?? String(cat.ownerId)}` : '系统'}
                  selectable={bulkMode}
                  selected={selectedIds.has(cat.id)}
                  onToggleSelected={toggleSelected}
                  onOpen={(id) => navigate(`/admin/categories/${id}${location.search || ''}`)}
                  onDelete={(id) => openConfirm('delete', id)}
                  onRestore={(id) => openConfirm('restore', id)}
                  onPermanentDelete={(id) => openConfirm('purge', id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {pageItems.map((cat) => (
                <CategoryListItem
                  key={cat.id}
                  category={cat}
                  mode="admin"
                  ownerLabel={cat.ownerId ? `@${ownerNameById.get(String(cat.ownerId)) ?? String(cat.ownerId)}` : '系统'}
                  selectable={bulkMode}
                  selected={selectedIds.has(cat.id)}
                  onToggleSelected={toggleSelected}
                  onOpen={(id) => navigate(`/admin/categories/${id}${location.search || ''}`)}
                  onDelete={(id) => openConfirm('delete', id)}
                  onRestore={(id) => openConfirm('restore', id)}
                  onPermanentDelete={(id) => openConfirm('purge', id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <NeonButton
                variant="ghost"
                icon={<ChevronLeft size={16} />}
                disabled={clampedPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                上一页
              </NeonButton>
              <div className="text-xs text-slate-500 font-mono">
                第 {clampedPage} / {totalPages} 页
              </div>
              <NeonButton
                variant="ghost"
                icon={<ChevronRight size={16} />}
                disabled={clampedPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                下一页
              </NeonButton>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!confirm.type}
        onClose={() => setConfirm({ type: null, id: null })}
        onConfirm={runAction}
        type={confirm.type === 'restore' ? 'success' : confirm.type === 'delete' ? 'warning' : 'danger'}
        confirmDisabled={!!workingId}
        cancelDisabled={!!workingId}
        closeDisabled={!!workingId}
        title={
          confirm.type === 'delete'
            ? '移入回收站'
            : confirm.type === 'restore'
              ? '恢复专栏'
              : '彻底删除'
        }
        message={
          confirm.type === 'delete' ? (
            <>该专栏将进入回收站。</>
          ) : confirm.type === 'restore' ? (
            <>该专栏将恢复为正常状态。</>
          ) : (
            <>该操作不可撤销，将彻底删除该专栏并解绑相关文章的分类。</>
          )
        }
        confirmText={confirm.type === 'restore' ? '恢复' : confirm.type === 'delete' ? '移入回收站' : '删除'}
      />

      <ConfirmModal
        isOpen={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => {
          const type = bulkConfirm?.type;
          setBulkConfirm(null);
          if (!type) return;
          void runBulk(type);
        }}
        type={bulkConfirm?.type === 'restore' ? 'success' : 'danger'}
        confirmDisabled={bulkWorking}
        cancelDisabled={bulkWorking}
        closeDisabled={bulkWorking}
        title={bulkConfirm?.type === 'restore' ? '批量恢复' : '批量删除'}
        message={
          bulkConfirm?.type === 'restore' ? (
            <>确认恢复已选择的 {selectedIds.size} 个专栏？</>
          ) : (
            <>确认彻底删除已选择的 {selectedIds.size} 个专栏？该操作不可撤销。</>
          )
        }
        confirmText={bulkConfirm?.type === 'restore' ? '恢复' : '删除'}
      />
    </div>
  );
};
