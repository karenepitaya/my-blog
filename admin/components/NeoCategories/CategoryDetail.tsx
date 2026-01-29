import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageUp, Save, Trash2, RotateCcw, Ban, Plus, Pencil, MoveRight, Loader2, CheckSquare, X, Timer } from 'lucide-react';
import type { Article, Category } from '../../types';
import { ArticleStatus, CategoryStatus } from '../../types';
import { GlassCard } from '../NeoShared/ui/GlassCard';
import { NeonButton } from '../NeoShared/ui/NeonButton';
import { CyberInput } from '../NeoShared/ui/CyberInput';
import { ConfirmModal } from '../NeoShared/ui/ConfirmModal';
import { useNeoToast } from '../NeoShared/ui/Toast';
import { useNeoAdminRuntime } from '../NeoShared/runtime/NeoAdminRuntimeContext';
import { formatDateShort, formatDateTimeShort, getDaysLeft, gradientBySeed, isCategoryTrashed } from './utils';
import { toFriendlyNeoError } from './utils/errors';
import { prepareCategoryCoverImage } from './utils/image';
import { ApiService } from '../../services/api';

function statusLabel(status: ArticleStatus): string {
  if (status === ArticleStatus.PUBLISHED) return '已发布';
  if (status === ArticleStatus.PENDING_DELETE) return '回收站';
  if (status === ArticleStatus.EDITING) return '编辑中';
  return '草稿';
}

function statusPillClass(status: ArticleStatus): string {
  if (status === ArticleStatus.PUBLISHED) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
  if (status === ArticleStatus.PENDING_DELETE) return 'bg-red-500/10 text-red-300 border-red-500/20';
  return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
}

export const CategoryDetail: React.FC = () => {
  const runtime = useNeoAdminRuntime();
  const toast = useNeoToast();
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || '';

  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [draft, setDraft] = useState<Partial<Category>>({});
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [autoOptimizeCover, setAutoOptimizeCover] = useState(true);
  const [confirm, setConfirm] = useState<
    | { type: 'delete' | 'restore' | 'confirm-delete' }
    | { type: null }
  >({ type: null });
  const [confirmWorking, setConfirmWorking] = useState(false);

  const [movingArticleIds, setMovingArticleIds] = useState<Set<string>>(() => new Set());
  const [articleBulkMode, setArticleBulkMode] = useState(false);
  const [selectedArticleIds, setSelectedArticleIds] = useState<Set<string>>(() => new Set());
  const [bulkMoveTarget, setBulkMoveTarget] = useState<string>(''); // '' = unassigned
  const [bulkMoving, setBulkMoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isTrashed = isCategoryTrashed(category?.status);
  const coverGradient = gradientBySeed(category?.slug || id);
  const deleteDaysLeft = useMemo(() => getDaysLeft(category?.deleteScheduledAt), [category?.deleteScheduledAt]);

  const relatedArticles: Article[] = useMemo(
    () => runtime.articles.filter((a) => String(a.categoryId ?? '') === id),
    [id, runtime.articles]
  );

  const selectableCategories = useMemo(() => {
    return runtime.categories.filter((c) => c.status === CategoryStatus.ACTIVE);
  }, [runtime.categories]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const detail = await runtime.loadCategoryDetail(id);
      if (!detail) throw new Error('CATEGORY_NOT_FOUND');
      setCategory(detail);
      setDraft({
        name: detail.name,
        slug: detail.slug,
        description: detail.description ?? '',
        coverImageUrl: detail.coverImageUrl ?? null,
      });
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
      navigate('/categories', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canEdit = !isTrashed;

  const save = async () => {
    if (!category) return;
    if (saving) return;
    setSaving(true);
    try {
      await runtime.saveCategory({
        id: category.id,
        name: String(draft.name ?? '').trim(),
        slug: String(draft.slug ?? '').trim(),
        description: String(draft.description ?? '').trim() ? String(draft.description ?? '').trim() : null,
        coverImageUrl: draft.coverImageUrl ?? null,
      });
      toast.success('已保存');
      await load();
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setSaving(false);
    }
  };

  const uploadCover = async (file: File) => {
    if (coverUploading) return;
    setCoverUploading(true);
    try {
      const prepared = autoOptimizeCover ? await prepareCategoryCoverImage(file) : file;
      const url = await runtime.uploadCategoryCover(prepared);
      setDraft((prev) => ({ ...prev, coverImageUrl: url }));
      toast.success('封面已上传');
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setCoverUploading(false);
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
        await runtime.confirmDeleteCategory(category.id);
        toast.success('已删除');
        navigate('/categories', { replace: true });
      }
    } catch (err) {
      toast.error(toFriendlyNeoError(err));
    } finally {
      setConfirmWorking(false);
      setConfirm({ type: null });
    }
  };

  if (!id) return null;

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <NeonButton variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/categories')}>
          返回列表
        </NeonButton>
        <div className="flex items-center gap-3">
          {isTrashed ? (
            <>
              <NeonButton variant="success" icon={<RotateCcw size={16} />} onClick={() => setConfirm({ type: 'restore' })}>
                恢复
              </NeonButton>
              <NeonButton variant="danger" icon={<Ban size={16} />} onClick={() => setConfirm({ type: 'confirm-delete' })}>
                确认删除
              </NeonButton>
            </>
          ) : (
            <>
              <NeonButton variant="secondary" icon={<ImageUp size={16} />} disabled={coverUploading} onClick={() => fileInputRef.current?.click()}>
                上传封面
              </NeonButton>
              <NeonButton variant="warning" icon={<Trash2 size={16} />} onClick={() => setConfirm({ type: 'delete' })}>
                移入回收站
              </NeonButton>
              <NeonButton variant="primary" icon={<Save size={16} />} disabled={!canEdit || saving} onClick={save}>
                保存
              </NeonButton>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadCover(file);
          e.currentTarget.value = '';
        }}
      />

      {loading || !category ? (
        <GlassCard className="py-16 text-center text-muted">加载中…</GlassCard>
      ) : (
        <>
          <GlassCard noPadding className="overflow-hidden border border-border">
            <div className="relative h-[200px]">
              {draft.coverImageUrl ? (
                <img src={String(draft.coverImageUrl)} className={`absolute inset-0 w-full h-full object-cover ${isTrashed ? 'grayscale' : ''}`} />
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
                      <div className="mt-2 text-[11px] text-slate-300 font-mono flex items-center gap-2">
                        <Timer size={14} className="text-red-300" />
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
              <div className="text-sm font-semibold text-secondary">专栏信息</div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-fg/3 px-4 py-3">
                <div className="text-xs text-slate-300 font-bold">
                  封面处理
                  <div className="text-[11px] text-muted font-mono mt-0.5">上传时自动居中裁剪 16:9 并压缩</div>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoOptimizeCover}
                    onChange={(e) => setAutoOptimizeCover(e.target.checked)}
                    disabled={coverUploading}
                  />
                  自动裁剪/压缩
                </label>
              </div>

              <CyberInput
                label="名称"
                value={String(draft.name ?? '')}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                disabled={!canEdit || saving}
              />
              <CyberInput
                label="Slug"
                value={String(draft.slug ?? '')}
                onChange={(e) => setDraft((prev) => ({ ...prev, slug: e.target.value }))}
                disabled={!canEdit || saving}
              />
              <div className="group">
                <label className="block text-sm font-medium text-muted mb-2 ml-1 transition-colors group-focus-within:text-primary">
                  简介
                </label>
                <textarea
                  value={String(draft.description ?? '')}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full min-h-[140px] bg-surface text-fg text-sm border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-fg/2 resize-y"
                  disabled={!canEdit || saving}
                  placeholder="这个专栏主要写什么？"
                />
              </div>
            </GlassCard>

            <GlassCard className="lg:col-span-2 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-secondary">专栏文章</div>
                  <div className="text-xs text-muted mt-1">当前专栏下共有 {relatedArticles.length} 篇文章</div>
                </div>
                <div className="flex items-center gap-2">
                  <NeonButton
                    variant={articleBulkMode ? 'primary' : 'ghost'}
                    icon={<CheckSquare size={16} />}
                    onClick={() => {
                      setArticleBulkMode(prev => !prev);
                      setSelectedArticleIds(new Set());
                    }}
                    disabled={bulkMoving}
                  >
                    批量
                  </NeonButton>
                  {articleBulkMode && (
                    <NeonButton
                      variant="ghost"
                      icon={<X size={16} />}
                      onClick={() => setSelectedArticleIds(new Set())}
                      disabled={bulkMoving}
                    >
                      清空
                    </NeonButton>
                  )}
                  <NeonButton
                    variant="secondary"
                    icon={<Plus size={16} />}
                    onClick={() => runtime.openEditorRoute({ categoryId: category.id })}
                    disabled={isTrashed}
                  >
                    新建文章
                  </NeonButton>
                </div>
              </div>

              {relatedArticles.length === 0 ? (
                <div className="text-muted text-sm py-10 text-center">暂无文章</div>
              ) : (
                <div className="space-y-3">
                  {articleBulkMode && (
                    <div className="rounded-2xl border border-border bg-fg/3 p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <div className="text-xs text-muted font-mono">已选择 {selectedArticleIds.size} 篇</div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                          <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
                            <MoveRight size={14} className="text-muted" />
                            <select
                              value={bulkMoveTarget}
                              onChange={(e) => setBulkMoveTarget(e.target.value)}
                              disabled={bulkMoving || isTrashed}
                              className="bg-transparent text-fg text-xs outline-none cursor-pointer min-w-[180px]"
                            >
                              <option value="" className="bg-surface text-fg">
                                解绑分类（无分类）
                              </option>
                              {selectableCategories
                                .filter((c) => c.id !== category.id)
                                .map((c) => (
                                  <option key={c.id} value={c.id} className="bg-surface text-fg">
                                    移动到：{c.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <NeonButton
                            variant="primary"
                            disabled={bulkMoving || isTrashed || selectedArticleIds.size === 0}
                            onClick={async () => {
                              if (bulkMoving) return;
                              const ids = Array.from(selectedArticleIds) as string[];
                              if (ids.length === 0) return;
                              setBulkMoving(true);
                              try {
                                const nextCategoryId = bulkMoveTarget ? bulkMoveTarget : null;
                                for (const aid of ids) {
                                  await ApiService.updateArticleCategory(runtime.session, aid, nextCategoryId);
                                }
                                await runtime.refresh();
                                toast.success('批量移动完成');
                                setSelectedArticleIds(new Set<string>());
                              } catch (err) {
                                toast.error(toFriendlyNeoError(err));
                              } finally {
                                setBulkMoving(false);
                              }
                            }}
                          >
                            应用
                          </NeonButton>
                        </div>
                      </div>
                    </div>
                  )}

                  {relatedArticles.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl bg-fg/3 border border-border hover:border-fg/20 transition-colors"
                    >
                      {articleBulkMode && (
                        <button
                          onClick={() =>
                            setSelectedArticleIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(a.id)) next.delete(a.id);
                              else next.add(a.id);
                              return next;
                            })
                          }
                          className={`shrink-0 w-9 h-9 rounded-xl border grid place-items-center ${
                            selectedArticleIds.has(a.id)
                              ? 'bg-primary/25 border-primary/40 text-white'
                              : 'bg-surface border-border text-muted hover:text-fg hover:bg-fg/5'
                          }`}
                          title={selectedArticleIds.has(a.id) ? '取消选择' : '选择'}
                        >
                          {selectedArticleIds.has(a.id) ? '✓' : ''}
                        </button>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-bold text-slate-100 truncate">{a.title}</div>
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${statusPillClass(a.status)}`}>
                            {statusLabel(a.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-muted font-mono">
                          ID: {a.id} · 更新：{formatDateShort(a.updatedAt ?? a.createdAt)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <NeonButton
                          variant="ghost"
                          icon={<Pencil size={16} />}
                          onClick={() => runtime.openEditorRoute({ id: a.id })}
                          disabled={a.status === ArticleStatus.PENDING_DELETE}
                        >
                          编辑
                        </NeonButton>

                        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl px-3 py-2">
                          {movingArticleIds.has(a.id) ? (
                            <Loader2 size={14} className="text-muted animate-spin" />
                          ) : (
                            <MoveRight size={14} className="text-muted" />
                          )}
                          <select
                            value={String(a.categoryId ?? '')}
                            disabled={isTrashed || movingArticleIds.has(a.id)}
                            onChange={async (e) => {
                              const next = e.target.value || null;
                              try {
                                setMovingArticleIds((prev) => new Set(prev).add(a.id));
                                await runtime.moveArticleCategory(a.id, next);
                                toast.success('已移动');
                              } catch (err) {
                                toast.error(toFriendlyNeoError(err));
                              } finally {
                                setMovingArticleIds((prev) => {
                                  const nextSet = new Set(prev);
                                  nextSet.delete(a.id);
                                  return nextSet;
                                });
                              }
                            }}
                            className="bg-transparent text-fg text-xs outline-none cursor-pointer min-w-[140px]"
                          >
                            <option value="" className="bg-surface text-fg">
                              无分类
                            </option>
                            {selectableCategories.map((c) => (
                              <option key={c.id} value={c.id} className="bg-surface text-fg">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
        title={confirm.type === 'delete' ? '移入回收站' : confirm.type === 'restore' ? '恢复专栏' : '确认删除'}
        message={
          confirm.type === 'delete' ? (
            <>该专栏将进入回收站，可在回收站中恢复或确认删除。</>
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
