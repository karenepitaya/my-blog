import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './AuthorConfig/components/ui/GlassCard';
import { NeonButton } from './AuthorConfig/components/ui/NeonButton';
import PageHeader from './PageHeader';
import {
  AuthorAnalyticsService,
  AuthorAnalyticsSession,
} from '../services/authorAnalyticsService';
import {
  AuthorInsights,
  AuthorInsightsRange,
  SparklinePoint,
} from '../services/authorAnalyticsMock';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  LineChart,
  Line,
  BarChart,
  Bar,
} from 'recharts';
import {
  BookOpen,
  Clock,
  ThumbsUp,
  TrendingUp,
  Filter,
  Flame,
  Award,
  Calendar,
  RefreshCw,
} from 'lucide-react';

type AuthorAnalyticsProps = {
  session: AuthorAnalyticsSession | null;
};

type ChartType = 'area' | 'bar' | 'line';

type MetricCardProps = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  colorClass: string;
  colorHex: string;
  chartType: ChartType;
  data: SparklinePoint[];
};

type TimeRangeOption = {
  label: string;
  value: AuthorInsightsRange;
};

const TIME_RANGES: TimeRangeOption[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YEAR', value: 'year' },
];

const pseudoRand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const STREAK_DATA = Array.from({ length: 364 }, (_, i) => {
  const weekIndex = Math.floor(i / 7);
  const dayIndex = i % 7;
  const weekdayBoost = dayIndex >= 1 && dayIndex <= 5 ? 0.15 : 0;
  const seasonal = Math.sin(weekIndex * 0.8) * 0.3 + 0.5;
  const jitter = pseudoRand(i * 3.17) * 0.4;
  const intensity = seasonal + weekdayBoost + jitter;
  if (intensity > 0.92) return 4;
  if (intensity > 0.75) return 3;
  if (intensity > 0.55) return 2;
  if (intensity > 0.3) return 1;
  return 0;
});

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  colorClass,
  colorHex,
  chartType,
  data,
}) => (
  <GlassCard className="relative overflow-hidden flex flex-col justify-between h-[160px] group transition-all hover:border-white/20" hoverEffect noPadding>
    <div className="p-6 relative z-20 h-full flex flex-col justify-between pointer-events-none">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-white shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
        <div className="text-3xl font-bold text-white tracking-tight drop-shadow-md">{value}</div>
      </div>
    </div>

    <div className="absolute right-0 bottom-0 w-[65%] h-[70%] z-10 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad_${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorHex} stopOpacity={0.6} />
                <stop offset="100%" stopColor={colorHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="natural" dataKey="v" stroke={colorHex} strokeWidth={2} fill={`url(#grad_${label})`} />
          </AreaChart>
        ) : chartType === 'bar' ? (
          <BarChart data={data} margin={{ bottom: 0 }}>
            <Bar dataKey="v" fill={colorHex} radius={[4, 4, 0, 0]} barSize={8} fillOpacity={0.8} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <Line type="monotone" dataKey="v" stroke={colorHex} strokeWidth={3} dot={{ r: 3, fill: colorHex, strokeWidth: 0 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>

    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.replace('text-', 'bg-').replace('bg-', 'bg-')}`} />
  </GlassCard>
);

const TimeRangePicker: React.FC<{ active: AuthorInsightsRange; onChange: (value: AuthorInsightsRange) => void }> = ({
  active,
  onChange,
}) => (
  <div className="flex bg-[#0F111A] p-1 rounded-lg border border-white/10">
    {TIME_RANGES.map((range) => (
      <button
        key={range.value}
        onClick={() => onChange(range.value)}
        className={`
          px-3 py-1 rounded-md text-[10px] font-bold transition-all
          ${active === range.value ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}
        `}
      >
        {range.label}
      </button>
    ))}
  </div>
);

const AuthorAnalytics: React.FC<AuthorAnalyticsProps> = ({ session }) => {
  const [range, setRange] = useState<AuthorInsightsRange>('7d');
  const [data, setData] = useState<AuthorInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async (force: boolean) => {
    const setBusy = force ? setRefreshing : setLoading;
    setBusy(true);
    setError(null);
    try {
      const result = await AuthorAnalyticsService.getInsights(session, { range, force });
      setData(result);
    } catch (err) {
      setError('内容洞察加载失败。');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadInsights(false);
  }, [range, session?.token]);

  const overview = data?.overview;
  const sparklines = data?.sparklines;

  const readValue = useMemo(() => (overview ? overview.totalReads.toLocaleString() : '--'), [overview]);
  const durationValue = useMemo(
    () => (overview ? formatDuration(overview.avgDurationSec) : '--:--'),
    [overview]
  );
  const likeValue = useMemo(() => (overview ? overview.totalLikes.toLocaleString() : '--'), [overview]);

  if (loading && !data) {
    return <div className="text-center text-slate-500 py-20">正在加载内容洞察...</div>;
  }

  if (!data) {
    return <div className="text-center text-rose-400 py-20">{error ?? '暂无内容洞察数据。'}</div>;
  }

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <PageHeader
        title="内容洞察"
        motto="追踪阅读、互动与创作热度，找到下一篇爆款的方向。"
        action={(
          <div className="flex flex-wrap items-center gap-3">
            <TimeRangePicker active={range} onChange={setRange} />
            <NeonButton
              variant="secondary"
              icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
              onClick={() => loadInsights(true)}
              disabled={refreshing}
            >
              刷新
            </NeonButton>
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="总阅读量"
          value={readValue}
          icon={BookOpen}
          colorClass="bg-primary"
          colorHex="#bd93f9"
          chartType="area"
          data={sparklines?.reads ?? []}
        />
        <MetricCard
          label="平均停留"
          value={durationValue}
          icon={Clock}
          colorClass="bg-secondary"
          colorHex="#8be9fd"
          chartType="bar"
          data={sparklines?.duration ?? []}
        />
        <MetricCard
          label="点赞总数"
          value={likeValue}
          icon={ThumbsUp}
          colorClass="bg-pink-500"
          colorHex="#ff79c6"
          chartType="line"
          data={sparklines?.likes ?? []}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> 阅读趋势
            </h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.readTrend}>
                <defs>
                  <linearGradient id="gradReadsAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#bd93f9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#bd93f9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0B0C15', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="pv" stroke="#475569" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="浏览量" />
                <Area type="monotone" dataKey="reads" stroke="#bd93f9" strokeWidth={3} fill="url(#gradReadsAuth)" name="阅读量" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col h-[400px]">
          <h3 className="text-base font-bold text-slate-200 tracking-wide mb-6 flex items-center gap-2">
            <Filter size={18} className="text-secondary" /> 互动漏斗
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip contentStyle={{ backgroundColor: '#0B0C15', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }} />
                <Funnel data={data.funnel} dataKey="value" isAnimationActive>
                  <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={10} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> 创作热力图
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">低</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#1a1b26] border border-white/5"></div>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-purple-900/40 border border-purple-500/20"></div>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-purple-600/60 border border-purple-400/30"></div>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#bd93f9] shadow-[0_0_5px_#bd93f9]"></div>
                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#ff79c6] shadow-[0_0_8px_#ff79c6] border border-white/30"></div>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">高</span>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto custom-scrollbar pb-2 z-10">
            <div className="min-w-max">
              <div className="flex text-[10px] font-mono text-slate-500 mb-2 pl-8">
                {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((m) => (
                  <span key={m} className="flex-1 w-[55px] opacity-70">
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[9px] font-mono text-slate-600 h-[105px] py-1 opacity-70">
                  <span>周一</span>
                  <span>周三</span>
                  <span>周五</span>
                </div>

                <div className="grid grid-rows-[repeat(7,1fr)] grid-flow-col gap-[3px] h-[105px]">
                  {STREAK_DATA.map((val, i) => (
                    <div
                      key={i}
                      className={`
                        w-3 h-3 rounded-[2px] transition-all duration-300
                        ${val === 0 ? 'bg-[#1a1b26] border border-white/[0.02]' : ''}
                        ${val === 1 ? 'bg-purple-900/40 border border-purple-500/20' : ''}
                        ${val === 2 ? 'bg-purple-600/60 border border-purple-400/30' : ''}
                        ${val === 3 ? 'bg-[#bd93f9] shadow-[0_0_6px_rgba(189,147,249,0.4)] z-0' : ''}
                        ${val === 4 ? 'bg-[#ff79c6] shadow-[0_0_10px_rgba(255,121,198,0.6)] border border-white/30 scale-105 z-0' : ''}
                        hover:scale-150 hover:z-50 hover:border-white hover:shadow-[0_0_15px_rgba(255,255,255,0.5)] cursor-pointer relative
                      `}
                      title={`第 ${i + 1} 天：${val === 0 ? '无' : val} 次创作`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-3 gap-4 relative z-10">
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase font-mono">最长连写</div>
              <div className="text-xl font-bold text-white mt-1">14 天</div>
            </div>
            <div className="text-center border-l border-white/5">
              <div className="text-xs text-slate-500 uppercase font-mono">当前连写</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">3 天</div>
            </div>
            <div className="text-center border-l border-white/5">
              <div className="text-xs text-slate-500 uppercase font-mono">日均产出</div>
              <div className="text-xl font-bold text-secondary mt-1">0.34</div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/5 blur-[80px] rounded-full pointer-events-none"></div>
        </GlassCard>

        <GlassCard className="flex flex-col h-full">
          <h3 className="text-base font-bold text-slate-200 tracking-wide mb-6 flex items-center gap-2">
            <Award size={18} className="text-yellow-400" /> 热门文章
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {data.topArticles.map((post, idx) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs
                      ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : idx === 1 ? 'bg-slate-500/20 text-slate-300' : idx === 2 ? 'bg-orange-700/20 text-orange-400' : 'text-slate-500'}
                    `}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 truncate group-hover:text-primary transition-colors max-w-[150px]">
                      {post.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                      <Calendar size={10} /> {post.date}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">{post.views.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 font-mono">浏览</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AuthorAnalytics;

