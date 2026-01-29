import React, { useMemo } from 'react';
import { ArrowRight, Ban, Calendar, Eye, Files, Heart, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { Category } from '../../../types';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { formatDateShort, gradientBySeed, isCategoryTrashed } from '../utils';

type CategoryListMode = 'author' | 'admin';

export type CategoryListItemProps = {
  category: Category;
  mode: CategoryListMode;
  ownerLabel?: string;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: (id: string) => void;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
};

export const CategoryListItem: React.FC<CategoryListItemProps> = ({
  category,
  mode,
  ownerLabel,
  selectable = false,
  selected = false,
  onToggleSelected,
  onOpen,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}) => {
  const isTrashed = isCategoryTrashed(category.status);
  const coverGradient = useMemo(() => gradientBySeed(category.slug || category.id), [category.id, category.slug]);
  const initial = useMemo(() => String(category.name || category.slug || 'N').trim().charAt(0).toUpperCase(), [category.name, category.slug]);

  return (
    <GlassCard
      noPadding
      className="group overflow-hidden bg-surface/60 border border-border hover:border-primary/25 transition-colors duration-200 cursor-pointer"
      onClick={() => onOpen?.(category.id)}
    >
      <div className="flex items-stretch gap-4 p-4">
        <div className="shrink-0 flex items-center gap-3">
          {selectable && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelected?.(category.id);
              }}
              className={`w-9 h-9 rounded-xl border backdrop-blur-md transition-colors grid place-items-center ${
                selected
                  ? 'bg-primary/12 border-primary/25 text-primary'
                  : 'bg-surface/50 border-border text-muted hover:text-fg hover:bg-fg/4 hover:border-fg/20'
              }`}
              aria-label={selected ? '取消选择' : '选择'}
              title={selected ? '取消选择' : '选择'}
            >
              {selected ? '✓' : ''}
            </button>
          )}

          <div
            className={`w-14 h-14 rounded-2xl overflow-hidden border border-border shadow-md flex items-center justify-center ${
              category.coverImageUrl ? 'bg-surface2' : coverGradient
            }`}
          >
            {category.coverImageUrl ? (
              <img src={category.coverImageUrl} alt={category.name} className={`w-full h-full object-cover ${isTrashed ? 'grayscale' : ''}`} />
            ) : (
              <span className="text-2xl font-black text-white/90">{initial}</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black text-white truncate group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                {isTrashed && (
                  <span className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-300">
                    回收站
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted font-mono truncate">
                <span>/{category.slug}</span>
                <span className="w-px h-4 bg-border" />
                <Calendar size={14} className="text-muted shrink-0" />
                <span className="truncate">{formatDateShort(category.createdAt ?? category.updatedAt)}</span>
                {mode === 'admin' && ownerLabel && (
                  <>
                    <span className="w-px h-4 bg-border" />
                    <span className="text-muted truncate">{ownerLabel}</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-muted line-clamp-2">
                {category.description ? category.description : '暂无简介'}
              </div>
            </div>

            <div className="shrink-0 hidden lg:flex items-center gap-10 pr-2">
              <div className="text-right">
                <div className="text-xs font-semibold text-muted">ARTICLES</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-fg font-mono text-base font-semibold">
                  <Files size={16} className="text-muted" />
                  {Number(category.articleCount ?? 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-muted">LIKES</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-fg font-mono text-base font-semibold">
                  <Heart size={16} className="text-muted" />
                  {Number(category.likes ?? 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-muted">VIEWS</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-fg font-mono text-base font-semibold">
                  <Eye size={16} className="text-muted" />
                  {Number(category.views ?? 0)}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {!isTrashed ? (
                <>
                  {mode === 'author' && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(category.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-fg/5 hover:bg-primary/10 border border-border hover:border-primary/30 text-muted hover:text-fg grid place-items-center transition-colors"
                      title="编辑"
                    >
                      <Pencil size={16} className="text-primary" />
                    </button>
                  )}
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-fg/5 hover:bg-fg/8 border border-border hover:border-fg/20 text-muted hover:text-fg grid place-items-center transition-colors"
                    title="进入"
                  >
                    <ArrowRight size={16} className="group-hover:-rotate-45 transition-transform duration-300" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-fg/5 hover:bg-danger/10 border border-border hover:border-danger/30 text-muted hover:text-danger grid place-items-center transition-colors"
                    title="移入回收站"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onRestore?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-fg/5 hover:bg-success/10 border border-border hover:border-success/30 text-muted hover:text-success grid place-items-center transition-colors"
                    title="恢复"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onPermanentDelete?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-fg/5 hover:bg-danger/10 border border-border hover:border-danger/30 text-muted hover:text-danger grid place-items-center transition-colors"
                    title={mode === 'admin' ? '彻底删除' : '确认删除'}
                  >
                    <Ban size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
