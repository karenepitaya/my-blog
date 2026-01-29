import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from './AuthorConfig/components/ui/GlassCard';
import { NeonButton } from './AuthorConfig/components/ui/NeonButton';
import PageHeader from './PageHeader';
import {
  AdminAnalyticsService,
  AdminAnalyticsSession,
} from '../services/adminAnalyticsService';
import { AdminInsights, AdminInsightsRange } from '../services/adminAnalyticsMock';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Database,
  Server,
  HardDrive,
  Layers,
  Zap,
  Cpu,
  Clock,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Activity,
} from 'lucide-react';

type AdminAnalyticsProps = {
  session: AdminAnalyticsSession | null;
};

type HighlightStat = {
  label: string;
  value: string;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
};

type TimeRangeOption = {
  label: string;
  value: AdminInsightsRange;
};

const TIME_RANGES: TimeRangeOption[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
];

const HighlightCard: React.FC<HighlightStat> = ({ label, value, icon: Icon, color }) => (
  <GlassCard
    className="flex items-center gap-5 p-5 relative overflow-hidden group transition-colors hover:border-fg/20"
    hoverEffect
  >
    <div className={`p-3 rounded-xl ${color} shrink-0 relative z-10 border border-border/60`}>
      <Icon size={24} />
    </div>
    <div className="relative z-10">
      <div className="text-muted text-xs font-medium mb-1">{label}</div>
      <div className="text-2xl font-semibold text-fg tracking-tight">{value}</div>
    </div>
  </GlassCard>
);

const TimeRangePicker: React.FC<{ active: AdminInsightsRange; onChange: (value: AdminInsightsRange) => void }> = ({
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

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ session }) => {
  const [data, setData] = useState<AdminInsights | null>(null);
  const [activeTab, setActiveTab] = useState<'resource' | 'db'>('resource');
  const [range, setRange] = useState<AdminInsightsRange>('1h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = async (force: boolean) => {
    const setBusy = force ? setRefreshing : setLoading;
    setBusy(true);
    setError(null);
    try {
      const result = await AdminAnalyticsService.getInsights(session, { range, force });
      setData(result);
    } catch (err) {
      setError('系统指标加载失败。');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadInsights(false);
  }, [range, session?.token]);

  const resources = data?.resources;
  const dbStats = data?.database;

  const resourceHighlights = useMemo<HighlightStat[]>(
    () => [
      { label: '运行时间', value: '14d 02h', icon: Clock, color: 'bg-fg/6 text-fg' },
      { label: '错误率', value: '0.12%', icon: AlertTriangle, color: 'bg-danger/10 text-danger' },
      { label: '缓存命中', value: '94.2%', icon: Zap, color: 'bg-success/10 text-success' },
      { label: '磁盘 IO', value: '450 /s', icon: HardDrive, color: 'bg-accent/10 text-accent' },
    ],
    []
  );

  const dbHighlights = useMemo<HighlightStat[]>(
    () => [
      { label: '文档总数', value: '19,266', icon: Database, color: 'bg-primary/12 text-primary' },
      { label: '存储占用', value: '1.34 GB', icon: HardDrive, color: 'bg-secondary/12 text-secondary' },
      { label: '平均查询', value: '12ms', icon: Zap, color: 'bg-success/10 text-success' },
      { label: '连接数', value: '12 / 100', icon: Activity, color: 'bg-accent/10 text-accent' },
    ],
    []
  );

  if (loading && !data) {
    return <div className="h-64 flex items-center justify-center text-muted">正在加载系统指标...</div>;
  }

  if (!data) {
    return <div className="h-64 flex items-center justify-center text-danger">{error ?? '系统指标加载失败。'}</div>;
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageHeader
        title="系统监控"
        motto="聚合运行状态与数据库指标，快速定位瓶颈与异常波动。"
        action={(
          <div className="flex flex-wrap items-center gap-3">
            <TimeRangePicker active={range} onChange={setRange} />
            <div className="h-6 w-px bg-border mx-2" />
            <div className="flex bg-surface p-1 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab('resource')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'resource'
                    ? 'bg-fg/8 text-fg border border-border'
                    : 'text-muted hover:text-fg'
                }`}
              >
                <Server size={16} /> 资源
              </button>
              <button
                onClick={() => setActiveTab('db')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'db'
                    ? 'bg-fg/8 text-fg border border-border'
                    : 'text-muted hover:text-fg'
                }`}
              >
                <Database size={16} /> 数据库
              </button>
            </div>
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

      {activeTab === 'resource' && resources && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {resourceHighlights.map((stat, index) => (
              <HighlightCard key={`${stat.label}-${index}`} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard noPadding className="h-[320px] flex flex-col col-span-1 md:col-span-2">
              <div className="p-4 border-b border-border flex justify-between items-center bg-surface2/70">
                <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                  <Server size={18} className="text-primary" /> 核心进程状态
                </h3>
                <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded border border-success/20">
                  系统稳定
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {resources.processes.map((process) => (
                  <div
                    key={`${process.name}-${process.pid}`}
                    className="relative overflow-hidden flex items-center justify-between p-3 bg-fg/3 border border-border rounded-lg group hover:border-fg/20 transition-colors"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-1000 group-hover:bg-primary/10"
                      style={{ width: `${process.cpu * 3}%` }}
                    />

                    <div className="relative z-10 flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          process.status === 'online'
                            ? 'bg-success'
                            : 'bg-danger'
                        }`}
                      />
                      <div>
                        <span className="text-sm font-semibold text-fg block">{process.name}</span>
                        <div className="text-[10px] text-muted font-mono flex items-center gap-2">
                          <span>PID: {process.pid === 0 ? 'KERNEL' : process.pid}</span>
                          <span className="opacity-50">|</span>
                          <span>{process.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 text-right font-mono">
                      <div className="text-xs text-secondary font-semibold">{process.mem} MB</div>
                      <div className="text-[10px] text-muted">
                        CPU: <span className="text-fg">{process.cpu}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                  <ShieldCheck size={18} className="text-secondary" /> HTTP 状态分布
                </h3>
              </div>
              <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resources.httpStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {resources.httpStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(var(--mt-color-surface))',
                        borderColor: 'rgb(var(--mt-color-border))',
                        borderRadius: '8px',
                        color: 'rgb(var(--mt-color-fg))',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-semibold text-fg font-mono">98%</span>
                  <span className="text-[10px] text-muted font-mono">成功率</span>
                </div>

                <div className="absolute bottom-2 w-full flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-mono">
                  {resources.httpStatus.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-muted">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                <Cpu size={18} className="text-secondary" /> 内存使用趋势
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resources.memoryTrend}>
                  <defs>
                    <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(var(--mt-color-primary))" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="rgb(var(--mt-color-primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--mt-color-border))" vertical={false} strokeOpacity={0.35} />
                  <XAxis dataKey="name" stroke="rgb(var(--mt-color-muted))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgb(var(--mt-color-muted))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgb(var(--mt-color-surface))',
                      borderColor: 'rgb(var(--mt-color-border))',
                      borderRadius: '8px',
                      color: 'rgb(var(--mt-color-fg))',
                    }}
                  />
                  <Area type="step" dataKey="db" stackId="1" stroke="none" fill="rgb(var(--mt-color-border))" name="MongoDB" fillOpacity={0.6} />
                  <Area type="step" dataKey="backend" stackId="1" stroke="none" fill="rgb(var(--mt-color-secondary))" name="后端" fillOpacity={0.22} />
                  <Area type="step" dataKey="frontend" stackId="1" stroke="rgb(var(--mt-color-primary))" fill="url(#gradMem)" name="前端" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'db' && dbStats && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dbHighlights.map((stat, index) => (
              <HighlightCard key={`${stat.label}-${index}`} {...stat} />
            ))}
          </div>

          <GlassCard className="h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-semibold text-fg flex items-center gap-2">
                  <Layers size={18} className="text-secondary" /> 数据读写分布
                </h3>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbStats.crudTrend} stackOffset="sign">
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
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="read" name="读取" stackId="a" fill="rgb(var(--mt-color-accent))" barSize={20} radius={[0, 0, 4, 4]} fillOpacity={0.9} />
                  <Bar dataKey="create" name="创建" stackId="a" fill="rgb(var(--mt-color-success))" barSize={20} fillOpacity={0.9} />
                  <Bar dataKey="update" name="更新" stackId="a" fill="rgb(var(--mt-color-warning))" barSize={20} fillOpacity={0.9} />
                  <Bar dataKey="delete" name="删除" stackId="a" fill="rgb(var(--mt-color-danger))" barSize={20} radius={[4, 4, 0, 0]} fillOpacity={0.9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-base font-semibold text-fg mb-6 flex items-center gap-2">
              <Database size={18} className="text-muted" /> 集合详情
            </h3>
            <div className="space-y-4">
              {dbStats.collections.map((col) => (
                <div key={col.name} className="flex items-center gap-4 text-xs font-mono">
                  <div className="w-32 text-muted truncate" title={col.name}>
                    {col.name}
                  </div>
                  <div className="flex-1 h-2 bg-surface2 rounded-full overflow-hidden border border-border/80">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(col.sizeMB / 1500) * 100}%`, backgroundColor: col.color }}
                    />
                  </div>
                  <div className="w-16 text-right text-fg">{col.sizeMB} MB</div>
                  <div className="w-20 text-right text-muted">{col.count.toLocaleString()} 条</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;

