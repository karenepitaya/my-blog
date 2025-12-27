import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Category, CategoryStatus, User, UserRole } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface CategoryMgmtProps {
  categories: Category[];
  users: User[];
  user: User;
  onSave: (cat: Partial<Category>) => Promise<void>;
  onDelete: (id: string, input?: { graceDays?: number }) => Promise<void>;
  onConfirmDelete: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPurge: (id: string) => Promise<void>;
  onUpdateAdminMeta: (id: string, input: { remark?: string | null }) => Promise<Category | null>;
  onLoadDetail: (id: string) => Promise<Category | null>;
}

type DeleteDialog = {
  id: string;
  name: string;
  status?: CategoryStatus;
};

const DEFAULT_DELETE_GRACE_DAYS = 7;

const CategoryMgmt: React.FC<CategoryMgmtProps> = ({
  categories,
  users,
  user,
  onSave,
  onDelete,
  onConfirmDelete,
  onRestore,
  onPurge,
  onUpdateAdminMeta,
  onLoadDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CategoryStatus>('ALL');
  const [isEditing, setIsEditing] = useState<string | 'NEW' | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialog | null>(null);
  const [deleteGraceDays, setDeleteGraceDays] = useState(DEFAULT_DELETE_GRACE_DAYS);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Category | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Category | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<Category | null>(null);
  const [detailCategory, setDetailCategory] = useState<Category | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [isSavingRemark, setIsSavingRemark] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const selectedOwnerId = queryParams.get('ownerId');

  const filteredCategories = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return categories.filter(cat => {
      const ownerMatch = isAdmin
        ? !selectedOwnerId || cat.ownerId === selectedOwnerId
        : !cat.ownerId || cat.ownerId === user.id;
      if (!ownerMatch) return false;
      const statusMatch = statusFilter === 'ALL' ? true : cat.status === statusFilter;
      if (!statusMatch) return false;
      if (!normalizedTerm) return true;
      return (
        (cat.name ?? '').toLowerCase().includes(normalizedTerm) ||
        (cat.slug ?? '').toLowerCase().includes(normalizedTerm)
      );
    });
  }, [categories, isAdmin, selectedOwnerId, statusFilter, searchTerm, user.id]);

  const getAuthorName = (ownerId?: string | null) => {
    if (!ownerId) return '系统';
    return users.find(u => u.id === ownerId)?.username || '未知作者';
  };

  const statusLabel = (status?: CategoryStatus) => {
    if (!status) return '未知';
    return status === CategoryStatus.ACTIVE ? '正常' : '待删除';
  };

  const statusClass = (status?: CategoryStatus) => {
    if (status === CategoryStatus.ACTIVE) return 'text-[#50fa7b] border-[#50fa7b]/30 bg-[#50fa7b]/10';
    if (status === CategoryStatus.PENDING_DELETE) return 'text-[#ff5545] border-[#ff5545]/30 bg-[#ff5545]/10';
    return 'text-[#6272a4] border-[#44475a] bg-[#44475a]/10';
  };

  const startEdit = (cat?: Category) => {
    if (isAdmin) return;
    if (cat) {
      setIsEditing(cat.id);
      setFormData(cat);
    } else {
      setIsEditing('NEW');
      setFormData({ name: '', slug: '', description: '' });
    }
  };

  const openDeleteDialog = (cat: Category) => {
    setDeleteDialog({ id: cat.id, name: cat.name, status: cat.status });
    setDeleteGraceDays(DEFAULT_DELETE_GRACE_DAYS);
  };

  const openDetail = async (cat: Category) => {
    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(cat.id);
      const next = detail ?? cat;
      setDetailCategory(next);
      setAdminRemark(next.adminRemark ?? '');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!detailCategory) return;
    setIsSavingRemark(true);
    try {
      const updated = await onUpdateAdminMeta(detailCategory.id, {
        remark: adminRemark.trim() ? adminRemark.trim() : null,
      });
      if (updated) {
        setDetailCategory(updated);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSavingRemark(false);
    }
  };

  const statusFilters: Array<{ label: string; value: CategoryStatus | 'ALL' }> = [
    { label: '全部', value: 'ALL' },
    { label: '正常', value: CategoryStatus.ACTIVE },
    { label: '回收站', value: CategoryStatus.PENDING_DELETE },
  ];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="分类/专栏管理"
        motto={isAdmin ? '管理全站分类节点与状态。' : '维护你的专栏与文章归档。'}
      />

      {isAdmin && (
        <div className="mb-8 p-4 bg-[#21222c] border border-[#44475a] rounded-xl animate-in slide-in-from-top-2 duration-500">
          <p className="text-sm text-[#6272a4] font-black uppercase mb-3 ml-2 tracking-widest">作者筛选</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/categories')}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                !selectedOwnerId
                  ? 'bg-[#bd93f9] text-[#282a36]'
                  : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
              }`}
            >
              全部作者
            </button>
            {users
              .filter(u => u.role === UserRole.AUTHOR)
              .map(u => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/categories?ownerId=${u.id}`)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    selectedOwnerId === u.id
                      ? 'bg-[#bd93f9] text-[#282a36]'
                      : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
                  }`}
                >
                  @{u.username}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="搜索分类名或 slug"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#21222c] border border-[#44475a] px-6 py-4 rounded-xl text-sm text-[#f8f8f2] focus:border-[#bd93f9] focus:outline-none transition-all placeholder-[#44475a] shadow-inner font-mono"
        />
        {!isAdmin && !isEditing && (
          <button
            onClick={() => startEdit()}
            className="flex items-center gap-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            <Icons.Plus />
            新建专栏
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-4">
        {statusFilters.map(s => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value as any)}
            className={`px-5 py-3 text-[10px] font-black rounded-xl border transition-all whitespace-nowrap uppercase tracking-widest ${
              statusFilter === s.value
                ? 'bg-[#bd93f9] text-[#282a36] border-[#bd93f9] shadow-lg shadow-purple-500/20'
                : 'text-[#6272a4] border-[#44475a] hover:text-[#f8f8f2] hover:bg-[#44475a]/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!isAdmin && isEditing && (
        <div className="bg-[#21222c] border border-[#bd93f9]/30 rounded-2xl p-8 mb-10 shadow-2xl animate-in zoom-in-95 duration-500">
          <h3 className="text-xs font-black text-[#bd93f9] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-[#bd93f9] rounded-full animate-pulse shadow-[0_0_8px_#bd93f9]" />
            {isEditing === 'NEW' ? '创建专栏' : '编辑专栏'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm text-[#6272a4] font-black uppercase tracking-widest ml-1">名称</label>
              <input
                type="text"
                placeholder="专栏名称"
                className="w-full bg-[#282a36] border border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a]"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#6272a4] font-black uppercase tracking-widest ml-1">Slug</label>
              <input
                type="text"
                placeholder="category-slug"
                className="w-full bg-[#282a36] border border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a]"
                value={formData.slug || ''}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm text-[#6272a4] font-black uppercase tracking-widest ml-1">简介</label>
              <input
                type="text"
                placeholder="简短描述"
                className="w-full bg-[#282a36] border border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a]"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-10 flex gap-4 justify-end border-t border-[#44475a] pt-8">
            <button
              onClick={() => setIsEditing(null)}
              className="px-6 py-2 text-xs font-black text-[#6272a4] hover:text-[#f8f8f2] uppercase tracking-widest"
            >
              取消
            </button>
            <button
              onClick={async () => {
                try {
                  await onSave(formData);
                  setIsEditing(null);
                } catch (err) {
                  alert((err as Error).message);
                }
              }}
              className="px-10 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#6272a4] font-mono text-xs uppercase italic">
            暂无匹配专栏。
          </div>
        ) : (
          filteredCategories.map(cat => (
            <div
              key={cat.id}
              className="bg-[#21222c] border border-[#44475a] p-8 rounded-2xl relative group hover:border-[#bd93f9]/50 transition-all duration-300 shadow-xl hover:-translate-y-1"
            >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <h4 className="text-lg font-black text-[#f8f8f2] tracking-tight group-hover:text-[#bd93f9] transition-colors italic uppercase">
                  {cat.name}
                </h4>
                <span className={`text-[9px] px-2 py-0.5 rounded border font-black uppercase ${statusClass(cat.status)}`}>
                  {statusLabel(cat.status)}
                </span>
              </div>
              <div className="flex gap-2">
                {isAdmin ? (
                  <>
                    <button
                      onClick={() => openDetail(cat)}
                      className="p-2 text-[#8be9fd] hover:text-[#f8f8f2] hover:bg-[#8be9fd]/10 rounded-lg transition-colors"
                      title="详情"
                    >
                      <Icons.Edit />
                    </button>
                    {cat.status === CategoryStatus.PENDING_DELETE ? (
                      <>
                        <button
                          onClick={() => setRestoreTarget(cat)}
                          className="p-2 text-[#50fa7b] hover:bg-[#50fa7b]/10 rounded-lg transition-colors"
                          title="恢复"
                        >
                          <Icons.Restore />
                        </button>
                        <button
                          onClick={() => setPurgeTarget(cat)}
                          className="p-2 text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-colors"
                          title="彻底删除"
                        >
                          <Icons.Trash />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openDeleteDialog(cat)}
                        className="p-2 text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Icons.Trash />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {cat.status === CategoryStatus.ACTIVE ? (
                      <>
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-2 text-[#6272a4] hover:text-[#8be9fd] hover:bg-[#8be9fd]/10 rounded-lg transition-colors"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(cat)}
                          className="p-2 text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-colors"
                        >
                          <Icons.Trash />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteTarget(cat)}
                        className="px-3 py-1 bg-[#282a36] border border-[#ff5545]/30 text-[#ff5545] text-[9px] font-black rounded uppercase"
                      >
                        彻底删除
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="mb-4">
              <span className="text-[10px] font-black text-[#bd93f9] bg-[#bd93f9]/10 border border-[#bd93f9]/20 px-3 py-1 rounded-full uppercase tracking-widest">
                作者: {getAuthorName(cat.ownerId)}
              </span>
            </div>
            <p className="text-sm text-[#f8f8f2]/60 leading-relaxed mb-6 h-12 overflow-hidden text-ellipsis italic">
              {cat.description ?? '暂无描述'}
            </p>
            <div className="pt-6 border-t border-[#44475a] flex justify-between items-center">
              <p className="text-[9px] text-[#6272a4] font-mono uppercase">/{cat.slug}</p>
              {cat.deleteScheduledAt && (
                <p className="text-[9px] text-[#ffb86c] font-mono uppercase">
                  删除时间: {new Date(cat.deleteScheduledAt).toLocaleDateString()}
                </p>
              )}
            </div>
            </div>
          ))
        )}
      </div>

      {deleteDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-[#44475a]">
              <h4 className="text-sm font-black text-[#f8f8f2] uppercase tracking-widest">删除专栏</h4>
              <p className="text-[10px] text-[#6272a4] mt-2 font-mono">{deleteDialog.name}</p>
            </div>
            <div className="p-6 space-y-4">
              {isAdmin ? (
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                    回收站保留天数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={deleteGraceDays}
                    onChange={e => setDeleteGraceDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none font-mono"
                  />
                </div>
              ) : (
                <p className="text-[10px] text-[#6272a4] font-mono">删除后将进入回收站，需手动彻底删除。</p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-2 border-t border-[#44475a]">
              <button
                onClick={() => setDeleteDialog(null)}
                className="flex-1 py-3 text-[10px] font-black text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!deleteDialog) return;
                  try {
                    await onDelete(deleteDialog.id, isAdmin ? { graceDays: deleteGraceDays } : undefined);
                  } catch (err) {
                    alert((err as Error).message);
                  } finally {
                    setDeleteDialog(null);
                  }
                }}
                className="flex-1 py-3 bg-[#ff5545] hover:bg-[#ff79c6] text-[#282a36] font-black text-[10px] rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!restoreTarget}
        title="确认恢复"
        message="将专栏从回收站恢复到正常状态。"
        confirmText="确认恢复"
        onConfirm={async () => {
          if (!restoreTarget) return;
          try {
            await onRestore(restoreTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setRestoreTarget(null);
          }
        }}
        onCancel={() => setRestoreTarget(null)}
      />

      <ConfirmModal
        isOpen={!!purgeTarget}
        title="彻底删除"
        message="此操作不可逆，确认后将彻底移除专栏。"
        confirmText="确认删除"
        onConfirm={async () => {
          if (!purgeTarget) return;
          try {
            await onPurge(purgeTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setPurgeTarget(null);
          }
        }}
        onCancel={() => setPurgeTarget(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteTarget}
        title="彻底删除"
        message="确认彻底删除该专栏，文章引用会被清理。"
        confirmText="确认删除"
        onConfirm={async () => {
          if (!confirmDeleteTarget) return;
          try {
            await onConfirmDelete(confirmDeleteTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setConfirmDeleteTarget(null);
          }
        }}
        onCancel={() => setConfirmDeleteTarget(null)}
      />

      {detailCategory && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-3xl bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#44475a]">
              <div>
                <h3 className="text-lg font-black text-[#f8f8f2]">专栏详情</h3>
                <p className="text-[10px] text-[#6272a4] font-mono uppercase mt-1">{detailCategory.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {isLoadingDetail && (
                  <span className="text-[10px] text-[#6272a4] font-mono uppercase">同步中...</span>
                )}
                <button
                  onClick={() => setDetailCategory(null)}
                  className="text-[#6272a4] hover:text-[#f8f8f2] text-xs font-black"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <h4 className="text-lg font-black text-[#f8f8f2]">{detailCategory.name}</h4>
                <p className="text-[10px] text-[#6272a4] font-mono uppercase">
                  作者: {getAuthorName(detailCategory.ownerId)} · /{detailCategory.slug}
                </p>
                <p className="text-sm text-[#f8f8f2]/70 leading-relaxed">
                  {detailCategory.description ?? '暂无描述'}
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">
                    管理备注
                  </label>
                  <textarea
                    value={adminRemark}
                    onChange={e => setAdminRemark(e.target.value)}
                    placeholder="填写内部备注..."
                    className="w-full h-24 bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDetailCategory(null)}
                    className="px-4 py-2 text-xs font-black text-[#6272a4] uppercase"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleSaveRemark}
                    disabled={isSavingRemark}
                    className="px-6 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest disabled:opacity-60"
                  >
                    {isSavingRemark ? '保存中...' : '保存备注'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMgmt;
