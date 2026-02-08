import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Ban, Save, User } from 'lucide-react';
import type { Category } from '../../types';
import { CategoryStatus, UserRole } from '../../types';
import { GlassCard } from '../NeoShared/ui/GlassCard';
import { NeonButton } from '../NeoShared/ui/NeonButton';
import { ConfirmModal } from '../NeoShared/ui/ConfirmModal';
import { CyberInput } from '../NeoShared/ui/CyberInput';
import { useNeoToast } from '../NeoShared/ui/Toast';
import { useNeoAdminRuntime } from '../NeoShared/runtime/NeoAdminRuntimeContext';
import { formatDateShort, formatDateTimeShort, getDaysLeft, gradientBySeed, isCategoryTrashed } from './utils';
import { toFriendlyNeoError } from './utils/errors';

export const AdminCategoryDetail: React.FC = () => {
  const runtime = useNeoAdminRuntime();
  const toast = useNeoToast();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const id = params.id || '';

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [remark, setRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);
  const [confirm, setConfirm] = useState<
    | { type: 'delete' | 'restore' | 'purge' }
    | { type: null }
  >({ type: null });
  const [confirmWorking, setConfirmWorking] = useState(false);

  const ownerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of runtime.users) map.set(u.id, u.username);
    return map;
  }, [runtime.users]);

  const coverGradient = gradientBySeed(category?.slug || id);
  const isTrashed = isCategoryTrashed(category?.status);
  const deleteDaysLeft = useMemo(() => getDaysLeft(category?.deleteScheduledAt), [category?.deleteScheduledAt]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await runtime.loadCategoryDetail(id);
      if (!detail) throw new Error('CATEGORY_NOT_FOUND');
      setCategory(detail);
      setRemark(detail.adminRemark ?? '');
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
      navigate(`/admin/categories${location.search || ''}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const saveRemark = async () => {
    if (!category) return;
    if (savingRemark) return;
    setSavingRemark(true);
    try {
      await runtime.updateCategoryAdminMeta(category.id, { remark: remark.trim() ? remark.trim() : null });
      toast.success('备注已保存');
      await load();
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setSavingRemark(false);
    }
  };

  const confirmAction = async () => {
    if (!category || !confirm.type) return;
    if (confirmWorking) return;
    setConfirmWorking(true);
    try {
      if (confirm.type === 'delete') {
        await runtime.deleteCategory(category.id);
        toast.warning('已移入回收站');
        await load();
      } else if (confirm.type === 'restore') {
        await runtime.restoreCategory(category.id);
        toast.success('已恢复');
        await load();
      } else {
        await runtime.purgeCategory(category.id);
        toast.success('已彻底删除');
        navigate(`/admin/categories${location.search || ''}`, { replace: true });
      }
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setConfirmWorking(false);
      setConfirm({ type: null });
    }
  };

  if (!id) return null;
  if (runtime.user.role !== UserRole.ADMIN) return null;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <NeonButton variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate(`/admin/categories${location.search || ''}`)}>
          返回列表
        </NeonButton>
        <div className="flex items-center gap-3">
          {isTrashed ? (
            <>
              <NeonButton variant="success" icon={<RotateCcw size={16} />} onClick={() => setConfirm({ type: 'restore' })}>
                恢复
              </NeonButton>
              <NeonButton variant="danger" icon={<Ban size={16} />} onClick={() => setConfirm({ type: 'purge' })}>
                彻底删除
              </NeonButton>
            </>
          ) : (
            <NeonButton variant="warning" icon={<Trash2 size={16} />} onClick={() => setConfirm({ type: 'delete' })}>
              移入回收站
            </NeonButton>
          )}
        </div>
      </div>

      {loading || !category ? (
        <GlassCard className="py-16 text-center text-muted">加载中…</GlassCard>
      ) : (
        <>
          <GlassCard noPadding className="overflow-hidden border border-border">
            <div className="relative h-[200px]">
              {category.coverImageUrl ? (
                <img src={category.coverImageUrl} className={`absolute inset-0 w-full h-full object-cover ${isTrashed ? 'grayscale' : ''}`} />
              ) : (
                <div className={`absolute inset-0 ${coverGradient} ${isTrashed ? 'grayscale' : ''}`} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-end justify-between gap-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-black text-white truncate">{category.name}</div>
                      {isTrashed && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-300">
                          回收站
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted font-mono truncate">/{category.slug}</div>
                    <div className="mt-2 text-xs text-muted">
                      创建：{formatDateShort(category.createdAt)} · 更新：{formatDateShort(category.updatedAt)}
                    </div>
                    {isTrashed && category.deleteScheduledAt && (
                      <div className="mt-2 text-[11px] text-slate-300 font-mono">
                        预计清理：{formatDateTimeShort(category.deleteScheduledAt)}
                        {deleteDaysLeft !== null ? ` · 剩余 ${deleteDaysLeft} 天` : ''}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3 text-xs font-mono text-muted">
                    <span className="px-3 py-2 rounded-xl bg-fg/5 border border-border">文章 {Number(category.articleCount ?? 0)}</span>
                    <span className="px-3 py-2 rounded-xl bg-fg/5 border border-border">浏览 {Number(category.views ?? 0)}</span>
                    <span className="px-3 py-2 rounded-xl bg-fg/5 border border-border">喜欢 {Number(category.likes ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <GlassCard className="lg:col-span-1 space-y-5">
              <div className="text-sm font-semibold text-secondary">专栏信息（只读）</div>

              <CyberInput label="名称" value={category.name} disabled />
              <CyberInput label="Slug" value={category.slug} disabled />

              <div className="flex items-center gap-2 text-sm text-slate-300">
                <User size={16} className="text-secondary" />
                <span className="font-bold">作者：</span>
                <span className="text-slate-200">
                  {category.ownerId ? `@${ownerNameById.get(String(category.ownerId)) ?? String(category.ownerId)}` : '系统'}
                </span>
              </div>

              <div className="text-xs text-muted font-mono">
                ID: {category.id} · status: {String(category.status ?? CategoryStatus.ACTIVE)}
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-secondary">管理员备注</div>
                  <div className="text-xs text-muted mt-1">Admin 视角仅维护备注与删除状态，不修改 name/slug。</div>
                </div>
                <NeonButton variant="primary" icon={<Save size={16} />} disabled={savingRemark} onClick={saveRemark}>
                  保存备注
                </NeonButton>
              </div>

              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full min-h-[160px] bg-surface text-fg text-sm border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted resize-y"
                placeholder="写点管理员侧的备注（仅后台可见）…"
              />
            </GlassCard>
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!confirm.type}
        onClose={() => setConfirm({ type: null })}
        onConfirm={confirmAction}
        type={confirm.type === 'restore' ? 'success' : confirm.type === 'delete' ? 'warning' : 'danger'}
        confirmDisabled={confirmWorking}
        cancelDisabled={confirmWorking}
        closeDisabled={confirmWorking}
        title={confirm.type === 'delete' ? '移入回收站' : confirm.type === 'restore' ? '恢复专栏' : '彻底删除'}
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
    </div>
  );
};
