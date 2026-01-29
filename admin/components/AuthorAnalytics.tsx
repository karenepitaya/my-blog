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
  <GlassCard
    className="relative overflow-hidden flex flex-col justify-between h-[160px] group transition-colors hover:border-fg/20"
    hoverEffect
    noPadding
  >
    <div className="p-6 relative z-20 h-full flex flex-col justify-between pointer-events-none">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-xl ${colorClass} text-fg shrink-0 border border-border/60`}>
          <Icon size={24} />
        </div>
      </div>
      <div>
        <div className="text-muted text-xs font-medium mb-1">{label}</div>
        <div className="text-3xl font-semibold text-fg tracking-tight">{value}</div>
      </div>
    </div>

    <div className="absolute right-0 bottom-0 w-[65%] h-[70%] z-10 opacity-25 group-hover:opacity-35 transition-opacity duration-300">
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad_${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorHex} stopOpacity={0.4} />
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

    <div
      className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-8 group-hover:opacity-12 transition-opacity ${
        colorClass.replace('text-', 'bg-').replace('bg-', 'bg-')
      }`}
    />
  </GlassCard>
);

const TimeRangePicker: React.FC<{ active: AuthorInsightsRange; onChange: (value: AuthorInsightsRange) => void }> = ({
  active,
  onChange,
}) => (
  <div className="flex bg-surface p-1 rounded-lg border border-border">
    {TIME_RANGES.map((range) => (
      <button
        key={range.value}
        onClick={() => onChange(range.value)}
        className={`
          px-3 py-1 rounded-md text-[10px] font-semibold transition-colors
          ${active === range.value ? 'bg-fg/8 text-fg' : 'text-muted hover:text-fg'}
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
    return <div className="text-center text-muted py-20">正在加载内容洞察...</div>;
  }

  if (!data) {
    return <div className="text-center text-danger py-20">{error ?? '暂无内容洞察数据。'}</div>;
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
          colorClass="bg-primary/12"
          colorHex="rgb(var(--mt-color-primary))"
          chartType="area"
          data={sparklines?.reads ?? []}
        />
        <MetricCard
          label="平均停留"
          value={durationValue}
          icon={Clock}
          colorClass="bg-secondary/12"
          colorHex="rgb(var(--mt-color-secondary))"
          chartType="bar"
          data={sparklines?.duration ?? []}
        />
        <MetricCard
          label="点赞总数"
          value={likeValue}
          icon={ThumbsUp}
          colorClass="bg-accent/12"
          colorHex="rgb(var(--mt-color-accent))"
          chartType="line"
          data={sparklines?.likes ?? []}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-semibold text-fg flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> 阅读趋势
            </h3>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.readTrend}>
                <defs>
                  <linearGradient id="gradReadsAuth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--mt-color-primary))" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="rgb(var(--mt-color-primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--mt-color-border))" vertical={false} strokeOpacity={0.35} />
                <XAxis dataKey="name" stroke="rgb(var(--mt-color-muted))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgb(var(--mt-color-muted))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--mt-color-surface))',
                    borderColor: 'rgb(var(--mt-color-border))',
                    borderRadius: '8px',
                    color: 'rgb(var(--mt-color-fg))',
                  }}
                />
                <Area type="monotone" dataKey="pv" stroke="rgb(var(--mt-color-muted))" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="浏览量" />
                <Area type="monotone" dataKey="reads" stroke="rgb(var(--mt-color-primary))" strokeWidth={3} fill="url(#gradReadsAuth)" name="阅读量" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col h-[400px]">
          <h3 className="text-base font-semibold text-fg mb-6 flex items-center gap-2">
            <Filter size={18} className="text-secondary" /> 互动漏斗
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--mt-color-surface))',
                    borderColor: 'rgb(var(--mt-color-border))',
                    borderRadius: '8px',
                    color: 'rgb(var(--mt-color-fg))',
                  }}
                />
                <Funnel data={data.funnel} dataKey="value" isAnimationActive>
                  <LabelList position="right" fill="rgb(var(--mt-color-fg))" stroke="none" dataKey="name" fontSize={10} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard className="lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-base font-semibold text-fg flex items-center gap-2">
              <Flame size={18} className="text-warning" /> 创作热力图
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted font-mono">低</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-[2px] bg-surface2 border border-border/70" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/12 border border-primary/20" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/20 border border-primary/25" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-primary/35 border border-primary/30" />
                <div className="w-2.5 h-2.5 rounded-[2px] bg-accent/30 border border-accent/30" />
              </div>
              <span className="text-[10px] text-muted font-mono">高</span>
            </div>
          </div>

          <div className="relative w-full overflow-x-auto custom-scrollbar pb-2 z-10">
            <div className="min-w-max">
              <div className="flex text-[10px] font-mono text-muted mb-2 pl-8">
                {['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'].map((m) => (
                  <span key={m} className="flex-1 w-[55px] opacity-70">
                    {m}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <div className="flex flex-col justify-between text-[9px] font-mono text-muted h-[105px] py-1 opacity-70">
                  <span>周一</span>
                  <span>周三</span>
                  <span>周五</span>
                </div>

                <div className="grid grid-rows-[repeat(7,1fr)] grid-flow-col gap-[3px] h-[105px]">
                  {STREAK_DATA.map((val, i) => (
                    <div
                      key={i}
                      className={`
                        w-3 h-3 rounded-[2px] transition-transform duration-200
                        ${val === 0 ? 'bg-surface2 border border-border/70' : ''}
                        ${val === 1 ? 'bg-primary/12 border border-primary/20' : ''}
                        ${val === 2 ? 'bg-primary/20 border border-primary/25' : ''}
                        ${val === 3 ? 'bg-primary/35 border border-primary/30' : ''}
                        ${val === 4 ? 'bg-accent/30 border border-accent/30' : ''}
                        hover:scale-110 cursor-pointer relative
                      `}
                      title={`第 ${i + 1} 天：${val === 0 ? '无' : val} 次创作`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4 relative z-10">
            <div className="text-center">
              <div className="text-xs text-muted font-mono">最长连写</div>
              <div className="text-xl font-semibold text-fg mt-1">14 天</div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-xs text-muted font-mono">当前连写</div>
              <div className="text-xl font-semibold text-success mt-1">3 天</div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-xs text-muted font-mono">日均产出</div>
              <div className="text-xl font-semibold text-secondary mt-1">0.34</div>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
        </GlassCard>

        <GlassCard className="flex flex-col h-full">
          <h3 className="text-base font-semibold text-fg mb-6 flex items-center gap-2">
            <Award size={18} className="text-warning" /> 热门文章
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-1">
            {data.topArticles.map((post, idx) => (
              <div
                key={post.id}
                className="flex items-center justify-between p-3 rounded-xl bg-fg/3 border border-border hover:bg-fg/5 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`
                      w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs
                      ${
                        idx === 0
                          ? 'bg-warning/15 text-warning border border-warning/20'
                          : idx === 1
                            ? 'bg-fg/5 text-fg border border-border'
                            : idx === 2
                              ? 'bg-secondary/12 text-secondary border border-secondary/20'
                              : 'text-muted'
                      }
                    `}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-fg truncate group-hover:text-primary transition-colors max-w-[150px]">
                      {post.title}
                    </div>
                    <div className="text-[10px] text-muted font-mono mt-0.5 flex items-center gap-2">
                      <Calendar size={10} /> {post.date}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-fg">{post.views.toLocaleString()}</div>
                  <div className="text-[10px] text-muted font-mono">浏览</div>
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

