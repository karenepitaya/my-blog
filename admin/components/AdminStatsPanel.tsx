
import React, { useState, useEffect } from 'react';
import { AnalyticsService, TrafficData, DailyPoint, ReferrerSource } from '../services/analyticsService';
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
          AnalyticsService.getReferrers()
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
        <div className="w-12 h-12 border-4 border-[#bd93f9] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-pixel text-[#6272a4] animate-pulse">正在同步统计指标...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <PageHeader title="数据统计面板" motto="核心流量引擎已连接。正在实时解构全站访问轨迹与转换路径_" />

      {/* KPI 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="总浏览量" value={overview?.pv.toLocaleString() || '0'} color="#bd93f9" trend="+12.4%" />
        <MetricCard label="独立访客" value={overview?.uv.toLocaleString() || '0'} color="#8be9fd" trend="+5.2%" />
        <MetricCard label="平均跳出率" value={overview?.bounceRate || '0%'} color="#ff79c6" trend="-2.1%" />
        <MetricCard label="平均停留时长" value={overview?.avgDuration || '00:00'} color="#50fa7b" trend="+0:45" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 趋势图表 - 占 2 列 */}
        <div className="lg:col-span-2 bg-[#21222c] border border-[#44475a] rounded-2xl p-6 lg:p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'linear-gradient(#44475a 1px, transparent 1px), linear-gradient(90deg, #44475a 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h3 className="text-sm font-normal text-[#f8f8f2] font-terminal uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 bg-[#bd93f9] rounded-full animate-ping" />
              14日流量趋势
            </h3>
            <span className="text-[10px] font-pixel text-[#6272a4]">单位：次/日</span>
          </div>
          <div className="h-64 relative z-10">
            <SimpleLineChart data={trends} color="#bd93f9" />
          </div>
        </div>

        {/* 来源分布 - 占 1 列 */}
        <div className="bg-[#21222c] border border-[#44475a] rounded-2xl p-6 lg:p-8 shadow-2xl">
          <h3 className="text-sm font-normal text-[#f8f8f2] font-terminal uppercase tracking-widest mb-10 flex items-center gap-3">
            <span className="w-2 h-2 bg-[#ff79c6] rounded-full" />
            访问来源分析
          </h3>
          <div className="space-y-6">
            {referrers.map((ref, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-pixel">
                  <span className="text-[#6272a4] uppercase">{ref.source}</span>
                  <span className="text-[#f8f8f2]">{ref.percentage}%</span>
                </div>
                <div className="h-2 bg-[#282a36] rounded-full overflow-hidden border border-[#44475a]">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${ref.percentage}%`, backgroundColor: ['#bd93f9', '#8be9fd', '#50fa7b', '#f1fa8c', '#ff79c6'][idx % 5] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 实时动态日志 */}
      <div className="bg-[#191a21] border-2 border-[#44475a] rounded-xl p-6 shadow-inner">
        <div className="flex items-center justify-between mb-4 border-b border-[#44475a] pb-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-[#50fa7b] rounded-full animate-pulse" />
             <span className="text-[10px] font-pixel text-[#50fa7b] uppercase tracking-widest">实时访问日志</span>
          </div>
          <span className="text-[9px] font-mono text-[#6272a4]">连接状态：已建立</span>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[10px] text-[#6272a4]">
           <p className="text-[#50fa7b]">[成功] <span className="text-[#f8f8f2]">GET /articles/重构之旅</span> - 200 OK - 124.56.7.8 (Chrome/MacOS)</p>
           <p>[信息] 会话建立：u_author_2 - 采样 100%</p>
           <p className="text-[#ff79c6]">[访问] <span className="text-[#f8f8f2]">GET /categories/productivity</span> - 200 OK - 192.168.1.5 (Mobile/Safari)</p>
           <p>[信息] 缓冲写入：12 条事件已入库</p>
           <p className="text-[#8be9fd]">[来源] 来自 github.com/dracula/dracula-theme - 优先级高</p>
           <p className="text-[#50fa7b]">[成功] <span className="text-[#f8f8f2]">POST /api/v1/heartbeat</span> - 204 No Content</p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color, trend }: { label: string; value: string; color: string; trend: string }) => (
  <div className="bg-[#21222c] border border-[#44475a] p-6 rounded-2xl shadow-xl hover:border-[#6272a4] transition-all group overflow-hidden relative">
    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 rounded-full blur-2xl" style={{ backgroundColor: color }} />
    <p className="text-[11px] font-pixel text-[#6272a4] uppercase mb-4 tracking-widest group-hover:text-[#f8f8f2] transition-colors">{label}</p>
    <div className="flex items-end justify-between relative z-10">
      <h4 className="text-3xl font-pixel font-bold" style={{ color: color }}>{value}</h4>
      <span className={`text-[10px] font-pixel px-2 py-0.5 rounded border ${trend.startsWith('+') ? 'text-[#50fa7b] border-[#50fa7b]/20 bg-[#50fa7b]/5' : 'text-[#ff5545] border-[#ff5545]/20 bg-[#ff5545]/5'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const SimpleLineChart = ({ data, color }: { data: DailyPoint[], color: string }) => {
  if (data.length === 0) return null;
  const safeMax = Math.max(1, ...data.map(d => d.views)) * 1.2;
  const width = 800;
  const height = 250;
  const denom = Math.max(1, data.length - 1);
  
  const points = data.map((d, i) => {
    const x = (i / denom) * width;
    const y = height - (d.views / safeMax) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(189,147,249,0.3)]">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 网格线 */}
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1="0" y1={height * p} x2={width} y2={height * p} stroke="#44475a" strokeWidth="0.5" strokeDasharray="4 4" />
      ))}
      <polyline points={areaPoints} fill="url(#areaGradient)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* 数据点 */}
      {data.map((d, i) => (
        <circle 
          key={i} 
          cx={(i / denom) * width} 
          cy={height - (d.views / safeMax) * height} 
          r="4" 
          fill="#282a36" 
          stroke={color} 
          strokeWidth="2" 
          className="hover:r-6 cursor-pointer transition-all"
        />
      ))}
    </svg>
  );
};

export default AdminStatsPanel;
