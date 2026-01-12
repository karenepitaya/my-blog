import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, RotateCcw, Ban, ArrowRight, Calendar, Eye, Heart, Files, Timer } from 'lucide-react';
import type { Category } from '../../../types';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { formatDateShort, formatDateTimeShort, getDaysLeft, gradientBySeed, isCategoryTrashed } from '../utils';

type CategoryCardMode = 'author' | 'admin';

interface CategoryCardProps {
  category: Category;
  mode: CategoryCardMode;
  ownerLabel?: string;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: (id: string) => void;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
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
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isTrashed = isCategoryTrashed(category.status);
  const coverGradient = gradientBySeed(category.slug || category.id);
  const daysLeft = useMemo(() => getDaysLeft(category.deleteScheduledAt), [category.deleteScheduledAt]);

  useEffect(() => {
    const onDocMouseDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <GlassCard
      noPadding
      className="group relative !overflow-visible min-h-[340px] flex flex-col bg-[#0f1016] border-white/10 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] cursor-pointer"
      onClick={() => onOpen?.(category.id)}
    >
      <div className="relative h-[140px] overflow-hidden shrink-0 rounded-t-2xl">
        {category.coverImageUrl ? (
          <img
            src={category.coverImageUrl}
            alt={category.name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100 ${isTrashed ? 'grayscale' : ''}`}
          />
        ) : (
          <div
            className={`absolute inset-0 ${coverGradient} opacity-80 transition-transform duration-700 group-hover:scale-110 ${isTrashed ? 'grayscale' : ''}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1016] to-transparent opacity-90" />
      </div>

      {selectable && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onToggleSelected?.(category.id);
          }}
          className={`absolute top-3 left-3 z-30 w-9 h-9 rounded-xl border backdrop-blur-md transition-colors grid place-items-center ${
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

      <div className="absolute top-3 right-3 z-30" ref={menuRef}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            setShowMenu(prev => !prev);
          }}
          className="p-2 rounded-lg bg-black/40 text-white/70 hover:text-white hover:bg-black/60 border border-white/10 hover:border-white/30 transition-all backdrop-blur-md"
          aria-label="更多操作"
        >
          <MoreHorizontal size={16} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1b26] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col animate-fade-in origin-top-right backdrop-blur-xl ring-1 ring-black/50">
            {!isTrashed ? (
              <>
                {mode === 'author' && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowMenu(false);
                      onEdit?.(category.id);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left border-b border-white/5"
                  >
                    <Pencil size={14} className="text-primary" /> 编辑
                  </button>
                )}
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowMenu(false);
                    onDelete?.(category.id);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <Trash2 size={14} className="text-orange-400" /> 移入回收站
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowMenu(false);
                    onRestore?.(category.id);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left border-b border-white/5"
                >
                  <RotateCcw size={14} className="text-emerald-400" /> 恢复
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowMenu(false);
                    onPermanentDelete?.(category.id);
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/5 hover:text-white transition-colors text-left"
                >
                  <Ban size={14} className="text-red-500" /> {mode === 'admin' ? '彻底删除' : '确认删除'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-5 pt-2 pb-5 relative -mt-4">
        <div className="mb-3 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <h3
              className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors line-clamp-1"
              title={category.name}
            >
              {category.name}
            </h3>
            {isTrashed && (
              <span className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-300">
                回收站
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono line-clamp-1">/{category.slug}</div>

          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-mono">
            <Calendar size={10} className="text-slate-600" />
            <span>{formatDateShort(category.createdAt ?? category.updatedAt)}</span>
            {mode === 'admin' && ownerLabel && (
              <>
                <span className="w-px h-3 bg-white/10" />
                <span className="text-slate-400">{ownerLabel}</span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4 min-h-[3.6em] relative z-10">
          {category.description ? category.description : '暂无简介'}
        </p>

        {isTrashed && category.deleteScheduledAt && (
          <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] text-slate-200/80">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-red-300" />
              <span className="font-mono">
                预计清理：{formatDateTimeShort(category.deleteScheduledAt)}
                {daysLeft !== null ? ` · 剩余 ${daysLeft} 天` : ''}
              </span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-white/5 flex items-end justify-between relative z-10">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wider whitespace-nowrap leading-none">
              <Files size={12} className="text-slate-600" />
              <span className="w-10">ART</span>
              <span className="text-slate-200 font-mono text-xs">{Number(category.articleCount ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wider whitespace-nowrap leading-none">
              <Eye size={12} className="text-slate-600" />
              <span className="w-10">VIEWS</span>
              <span className="text-slate-200 font-mono text-xs">{Number(category.views ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wider whitespace-nowrap leading-none">
              <Heart size={12} className="text-slate-600" />
              <span className="w-10">LIKES</span>
              <span className="text-slate-200 font-mono text-xs">{Number(category.likes ?? 0)}</span>
            </div>
          </div>

          <button
            onClick={(event) => {
              event.stopPropagation();
              onOpen?.(category.id);
            }}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/50 text-slate-300 hover:text-white flex items-center justify-center transition-all group/btn shadow-lg"
            title="进入专栏"
          >
            <ArrowRight size={16} className="group-hover/btn:-rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
};
