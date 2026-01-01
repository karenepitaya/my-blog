import React from 'react';
import { GlassCard } from './ui/GlassCard';
import { StatMetric } from '../types';
import { TrendingUp, TrendingDown, Minus, Activity, Users, Eye, Clock } from 'lucide-react';

const mockStats: StatMetric[] = [
  { id: '1', label: 'Total Views', value: '124,580', change: 12.4, trend: 'up', icon: <Eye />, color: 'success' },
  { id: '2', label: 'Unique Visitors', value: '42,300', change: 5.2, trend: 'up', icon: <Users />, color: 'secondary' },
  { id: '3', label: 'Bounce Rate', value: '32.4%', change: -2.1, trend: 'down', icon: <Activity />, color: 'accent' }, // down is good for bounce rate usually, but visually down is red/pink
  { id: '4', label: 'Avg. Duration', value: '04:12', change: 0.0, trend: 'neutral', icon: <Clock />, color: 'primary' },
];

export const StatsOverview: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {mockStats.map((stat) => (
        <GlassCard key={stat.id} hoverEffect className="group">
          <div className="flex justify-between items-start mb-4">
            <div className={`
              p-2.5 rounded-lg 
              bg-gradient-to-br from-white/[0.05] to-transparent
              border border-white/[0.05]
              text-${stat.color === 'success' ? 'emerald' : stat.color === 'accent' ? 'pink' : stat.color === 'secondary' ? 'cyan' : 'purple'}-400
            `}>
              {stat.icon && React.isValidElement(stat.icon) 
                ? React.cloneElement(stat.icon as React.ReactElement<any>, { size: 20 }) 
                : null}
            </div>
            
            <div className={`
              flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-full border
              ${stat.trend === 'up' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : stat.trend === 'down'
                ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }
            `}>
              {stat.trend === 'up' && <TrendingUp size={12} />}
              {stat.trend === 'down' && <TrendingDown size={12} />}
              {stat.trend === 'neutral' && <Minus size={12} />}
              <span>{Math.abs(stat.change || 0)}%</span>
            </div>
          </div>
          
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-2xl font-bold text-white tracking-tight font-mono">{stat.value}</div>
          </div>

          {/* Decorative glow behind */}
          <div className={`
            absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none
            ${stat.color === 'success' ? 'bg-emerald-500' : stat.color === 'accent' ? 'bg-pink-500' : stat.color === 'secondary' ? 'bg-cyan-500' : 'bg-purple-500'}
          `} />
        </GlassCard>
      ))}
    </div>
  );
};