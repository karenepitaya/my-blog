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
      className="group overflow-hidden bg-[#0b0c15]/60 border border-white/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
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
                  ? 'bg-primary/25 border-primary/40 text-white shadow-[0_0_18px_rgba(168,85,247,0.25)]'
                  : 'bg-black/30 border-white/10 text-white/60 hover:text-white hover:bg-black/50 hover:border-white/20'
              }`}
              aria-label={selected ? '取消选择' : '选择'}
              title={selected ? '取消选择' : '选择'}
            >
              {selected ? '✓' : ''}
            </button>
          )}

          <div
            className={`w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg flex items-center justify-center ${
              category.coverImageUrl ? 'bg-black/30' : coverGradient
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
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 font-mono truncate">
                <span>/{category.slug}</span>
                <span className="w-px h-4 bg-white/10" />
                <Calendar size={14} className="text-slate-600 shrink-0" />
                <span className="truncate">{formatDateShort(category.createdAt ?? category.updatedAt)}</span>
                {mode === 'admin' && ownerLabel && (
                  <>
                    <span className="w-px h-4 bg-white/10" />
                    <span className="text-slate-400 truncate">{ownerLabel}</span>
                  </>
                )}
              </div>
              <div className="mt-2 text-sm text-slate-400 line-clamp-2">
                {category.description ? category.description : '暂无简介'}
              </div>
            </div>

            <div className="shrink-0 hidden lg:flex items-center gap-10 pr-2">
              <div className="text-right">
                <div className="text-xs font-black tracking-widest uppercase text-slate-500">ARTICLES</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-slate-200 font-mono text-base font-bold">
                  <Files size={16} className="text-slate-600" />
                  {Number(category.articleCount ?? 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black tracking-widest uppercase text-slate-500">LIKES</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-slate-200 font-mono text-base font-bold">
                  <Heart size={16} className="text-slate-600" />
                  {Number(category.likes ?? 0)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black tracking-widest uppercase text-slate-500">VIEWS</div>
                <div className="mt-1 flex items-center justify-end gap-2 text-slate-200 font-mono text-base font-bold">
                  <Eye size={16} className="text-slate-600" />
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
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-slate-200 hover:text-white grid place-items-center transition-all"
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
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-slate-200 hover:text-white grid place-items-center transition-all"
                    title="进入"
                  >
                    <ArrowRight size={16} className="group-hover:-rotate-45 transition-transform duration-300" />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-200 hover:text-red-300 grid place-items-center transition-all"
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
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-200 hover:text-emerald-300 grid place-items-center transition-all"
                    title="恢复"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onPermanentDelete?.(category.id);
                    }}
                    className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-200 hover:text-red-300 grid place-items-center transition-all"
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
