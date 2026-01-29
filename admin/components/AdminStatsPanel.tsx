import React, { useEffect, useState } from 'react';
import type { DailyPoint, ReferrerSource, TrafficData } from '../services/analyticsService';
import { AnalyticsService } from '../services/analyticsService';
import PageHeader from './PageHeader';

const AdminStatsPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<TrafficData | null>(null);
  const [trends, setTrends] = useState<DailyPoint[]>([]);
  const [referrers, setReferrers] = useState<ReferrerSource[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ov, tr, re] = await Promise.all([
          AnalyticsService.getOverview(),
          AnalyticsService.getDailyTrends(),
          AnalyticsService.getReferrers(),
        ]);
        setOverview(ov);
        setTrends(tr);
        setReferrers(re);
      } catch (err) {
        console.error('Failed to fetch analytics metrics', err);
        setOverview(null);
        setTrends([]);
        setReferrers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary/40 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted">正在同步统计指标…</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-10">
      <PageHeader title="数据统计面板" motto="聚合全站流量概览与来源分布，辅助快速定位趋势波动。" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="总浏览量" value={overview?.pv.toLocaleString() || '0'} color="rgb(var(--mt-color-primary))" trend="+12.4%" />
        <MetricCard label="独立访客" value={overview?.uv.toLocaleString() || '0'} color="rgb(var(--mt-color-accent))" trend="+5.2%" />
        <MetricCard label="平均跳出率" value={overview?.bounceRate || '0%'} color="rgb(var(--mt-color-danger))" trend="-2.1%" />
        <MetricCard label="平均停留时长" value={overview?.avgDuration || '00:00'} color="rgb(var(--mt-color-success))" trend="+0:45" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-lg relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgb(var(--mt-color-border)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--mt-color-border)) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-sm font-medium text-fg flex items-center gap-3">
              <span className="w-2 h-2 bg-primary rounded-full motion-safe:animate-pulse" />
              14 日流量趋势
            </h3>
            <span className="text-[10px] font-mono text-muted">单位：次/日</span>
          </div>
          <div className="h-64 relative z-10">
            <SimpleLineChart data={trends} color="rgb(var(--mt-color-primary))" />
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
          <h3 className="text-sm font-medium text-fg mb-10 flex items-center gap-3">
            <span className="w-2 h-2 bg-accent rounded-full" />
            访问来源分析
          </h3>
          <div className="space-y-6">
            {referrers.map((ref, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted">{ref.source}</span>
                  <span className="text-fg">{ref.percentage}%</span>
                </div>
                <div className="h-2 bg-surface2 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full transition-all duration-700 ease-out"
                    style={{
                      width: `${ref.percentage}%`,
                      backgroundColor: [
                        'rgb(var(--mt-color-primary))',
                        'rgb(var(--mt-color-accent))',
                        'rgb(var(--mt-color-success))',
                        'rgb(var(--mt-color-warning))',
                        'rgb(var(--mt-color-secondary))',
                      ][idx % 5],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-surface2 border border-border rounded-xl p-6 shadow-inner">
        <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-success rounded-full motion-safe:animate-pulse" />
            <span className="text-[10px] font-mono text-success tracking-wider">实时访问日志</span>
          </div>
          <span className="text-[9px] font-mono text-muted">连接状态：已建立</span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[10px] text-muted">
          <p className="text-success">
            [成功] <span className="text-fg">GET /articles/重构之旅</span> - 200 OK - 124.56.7.8 (Chrome/MacOS)
          </p>
          <p>[信息] 会话建立：_author_2 - 采样 100%</p>
          <p className="text-accent">
            [访问] <span className="text-fg">GET /categories/productivity</span> - 200 OK - 192.168.1.5 (Mobile/Safari)
          </p>
          <p>[信息] 缓存写入：2 条事件已入库</p>
          <p className="text-secondary">[来源] 来自 github.com/dracula/dracula-theme - 优先级高</p>
          <p className="text-success">
            [成功] <span className="text-fg">POST /api/v1/heartbeat</span> - 204 No Content
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color, trend }: { label: string; value: string; color: string; trend: string }) => (
  <div className="bg-surface border border-border p-6 rounded-2xl shadow-lg hover:border-fg/20 transition-colors group overflow-hidden relative">
    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.06] rounded-full blur-2xl" style={{ backgroundColor: color }} />
    <p className="text-[11px] font-mono text-muted mb-4 tracking-wider group-hover:text-fg transition-colors">{label}</p>
    <div className="flex items-end justify-between relative z-10">
      <h4 className="text-3xl font-mono font-semibold tracking-tight" style={{ color }}>
        {value}
      </h4>
      <span
        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
          trend.startsWith('+') ? 'text-success border-success/20 bg-success/5' : 'text-danger border-danger/20 bg-danger/5'
        }`}
      >
        {trend}
      </span>
    </div>
  </div>
);

const SimpleLineChart = ({ data, color }: { data: DailyPoint[]; color: string }) => {
  if (data.length === 0) return null;
  const safeMax = Math.max(1, ...data.map((d) => d.views)) * 1.2;
  const width = 800;
  const height = 250;
  const denom = Math.max(1, data.length - 1);

  const points = data
    .map((d, i) => {
      const x = (i / denom) * width;
      const y = height - (d.views / safeMax) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1="0"
          y1={height * p}
          x2={width}
          y2={height * p}
          stroke="rgb(var(--mt-color-border))"
          strokeWidth="0.6"
          strokeDasharray="4 4"
          opacity="0.55"
        />
      ))}
      <polyline points={areaPoints} fill="url(#areaGradient)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={(i / denom) * width}
          cy={height - (d.views / safeMax) * height}
          r="4"
          fill="rgb(var(--mt-color-surface))"
          stroke={color}
          strokeWidth="2"
          className="hover:r-6 cursor-pointer transition-all"
        />
      ))}
    </svg>
  );
};

export default AdminStatsPanel;
