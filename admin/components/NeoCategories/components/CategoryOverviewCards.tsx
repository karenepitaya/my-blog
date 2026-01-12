import React, { useMemo } from 'react';
import { Layers, Heart } from 'lucide-react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';

function formatCompactNumber(value: number): string {
  try {
    return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  } catch {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return String(value);
  }
}

export const CategoryOverviewCards: React.FC<{
  activeCount: number;
  totalLikes: number;
}> = ({ activeCount, totalLikes }) => {
  const likesText = useMemo(() => formatCompactNumber(totalLikes), [totalLikes]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <GlassCard className="group relative overflow-hidden border-primary/20 hover:border-primary/35 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-[70px] bg-primary opacity-0 group-hover:opacity-15 transition-opacity duration-700" />
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-[0_0_18px_rgba(189,147,249,0.22)]">
              <Layers size={22} />
            </div>
            <div>
              <div className="text-sm font-black tracking-widest uppercase text-slate-400">活跃专栏</div>
              <div className="mt-1 text-4xl font-black font-mono tracking-tighter text-white">{activeCount}</div>
            </div>
          </div>
          <Layers size={64} className="text-white/5" />
        </div>
      </GlassCard>

      <GlassCard className="group relative overflow-hidden border-accent/20 hover:border-accent/35 transition-all duration-500 hover:-translate-y-1">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full blur-[70px] bg-accent opacity-0 group-hover:opacity-15 transition-opacity duration-700" />
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent shadow-[0_0_18px_rgba(255,121,198,0.18)]">
              <Heart size={22} />
            </div>
            <div>
              <div className="text-sm font-black tracking-widest uppercase text-slate-400">总获赞数</div>
              <div className="mt-1 text-4xl font-black font-mono tracking-tighter text-white">{likesText}</div>
            </div>
          </div>
          <Heart size={64} className="text-white/5" />
        </div>
      </GlassCard>
    </div>
  );
};
