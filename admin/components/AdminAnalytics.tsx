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
  <GlassCard className="flex items-center gap-5 p-5 relative overflow-hidden group transition-all hover:border-white/20" hoverEffect>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white shrink-0 relative z-10 shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
      <Icon size={24} />
    </div>
    <div className="relative z-10">
      <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
    </div>
  </GlassCard>
);

const TimeRangePicker: React.FC<{ active: AdminInsightsRange; onChange: (value: AdminInsightsRange) => void }> = ({
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
      { label: '运行时间', value: '14d 02h', icon: Clock, color: 'bg-white/10 text-white' },
      { label: '错误率', value: '0.12%', icon: AlertTriangle, color: 'bg-red-500/10 text-red-400' },
      { label: '缓存命中', value: '94.2%', icon: Zap, color: 'bg-emerald-500/10 text-emerald-400' },
      { label: '磁盘 IO', value: '450 /s', icon: HardDrive, color: 'bg-cyan-500/10 text-cyan-400' },
    ],
    []
  );

  const dbHighlights = useMemo<HighlightStat[]>(
    () => [
      { label: '文档总数', value: '19,266', icon: Database, color: 'bg-primary' },
      { label: '存储占用', value: '1.34 GB', icon: HardDrive, color: 'bg-pink-500' },
      { label: '平均查询', value: '12ms', icon: Zap, color: 'bg-emerald-500' },
      { label: '连接数', value: '12 / 100', icon: Activity, color: 'bg-blue-500' },
    ],
    []
  );

  if (loading && !data) {
    return <div className="h-64 flex items-center justify-center text-slate-500">正在加载系统指标...</div>;
  }

  if (!data) {
    return <div className="h-64 flex items-center justify-center text-rose-400">{error ?? '系统指标加载失败。'}</div>;
  }

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageHeader
        title="系统监控"
        motto="聚合运行状态与数据库指标，快速定位瓶颈与异常波动。"
        action={(
          <div className="flex flex-wrap items-center gap-3">
            <TimeRangePicker active={range} onChange={setRange} />
            <div className="h-6 w-px bg-white/10 mx-2" />
            <div className="flex bg-[#0F111A] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('resource')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'resource'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                <Server size={16} /> 资源
              </button>
              <button
                onClick={() => setActiveTab('db')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === 'db'
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-500 hover:text-white'
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
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#151621]">
                <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
                  <Server size={18} className="text-primary" /> 核心进程状态
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  系统稳定
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {resources.processes.map((process) => (
                  <div
                    key={`${process.name}-${process.pid}`}
                    className="relative overflow-hidden flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-lg group hover:border-white/10 transition-colors"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/5 transition-all duration-1000 group-hover:bg-primary/10"
                      style={{ width: `${process.cpu * 3}%` }}
                    />

                    <div className="relative z-10 flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          process.status === 'online'
                            ? 'bg-emerald-500 shadow-[0_0_4px_#10b981]'
                            : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <span className="text-sm font-bold text-slate-200 block">{process.name}</span>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>PID: {process.pid === 0 ? 'KERNEL' : process.pid}</span>
                          <span className="opacity-50">|</span>
                          <span>{process.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="relative z-10 text-right font-mono">
                      <div className="text-xs text-secondary font-bold">{process.mem} MB</div>
                      <div className="text-[10px] text-slate-400">
                        CPU: <span className="text-white">{process.cpu}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="h-[320px] flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
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
                        backgroundColor: '#0B0C15',
                        borderColor: '#ffffff20',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white font-mono">98%</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest">成功率</span>
                </div>

                <div className="absolute bottom-2 w-full flex flex-wrap justify-center gap-x-4 gap-y-2 text-[10px] font-mono">
                  {resources.httpStatus.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color, boxShadow: `0 0 5px ${entry.color}` }}
                      />
                      <span className="text-slate-300">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          <GlassCard className="h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
                <Cpu size={18} className="text-pink-500" /> 内存使用趋势
              </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resources.memoryTrend}>
                  <defs>
                    <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#bd93f9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#bd93f9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0C15', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                  />
                  <Area type="step" dataKey="db" stackId="1" stroke="none" fill="#44475a" name="MongoDB" />
                  <Area type="step" dataKey="backend" stackId="1" stroke="none" fill="#6272a4" name="后端" />
                  <Area type="step" dataKey="frontend" stackId="1" stroke="#bd93f9" fill="url(#gradMem)" name="前端" />
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
                <h3 className="text-base font-bold text-slate-200 tracking-wide flex items-center gap-2">
                  <Layers size={18} className="text-secondary" /> 数据读写分布
                </h3>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbStats.crudTrend} stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0C15', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="read" name="读取" stackId="a" fill="#8be9fd" barSize={20} radius={[0, 0, 4, 4]} />
                  <Bar dataKey="create" name="创建" stackId="a" fill="#50fa7b" barSize={20} />
                  <Bar dataKey="update" name="更新" stackId="a" fill="#ffb86c" barSize={20} />
                  <Bar dataKey="delete" name="删除" stackId="a" fill="#ff5555" barSize={20} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-base font-bold text-slate-200 tracking-wide mb-6 flex items-center gap-2">
              <Database size={18} className="text-slate-400" /> 集合详情
            </h3>
            <div className="space-y-4">
              {dbStats.collections.map((col) => (
                <div key={col.name} className="flex items-center gap-4 text-xs font-mono">
                  <div className="w-32 text-slate-400 truncate" title={col.name}>
                    {col.name}
                  </div>
                  <div className="flex-1 h-2 bg-[#0F111A] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(col.sizeMB / 1500) * 100}%`, backgroundColor: col.color }}
                    />
                  </div>
                  <div className="w-16 text-right text-slate-200">{col.sizeMB} MB</div>
                  <div className="w-20 text-right text-slate-500">{col.count.toLocaleString()} 条</div>
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

