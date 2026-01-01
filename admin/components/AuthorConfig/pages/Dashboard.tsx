import React from 'react';
import { StatsOverview } from '../components/StatsOverview';
import { GlassCard } from '../components/ui/GlassCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Terminal, Cpu, MemoryStick } from 'lucide-react';

const mockChartData = [
  { name: 'Mon', uv: 4000, pv: 2400 },
  { name: 'Tue', uv: 3000, pv: 1398 },
  { name: 'Wed', uv: 2000, pv: 9800 },
  { name: 'Thu', uv: 2780, pv: 3908 },
  { name: 'Fri', uv: 1890, pv: 4800 },
  { name: 'Sat', uv: 2390, pv: 3800 },
  { name: 'Sun', uv: 3490, pv: 4300 },
];

const mockLogs = [
  { id: 1, type: 'success', msg: 'GET /articles/react-hooks - 200 OK - 124.56.7.8' },
  { id: 2, type: 'info', msg: '[Session] User u_author_2 connected via WS' },
  { id: 3, type: 'warning', msg: 'POST /api/v1/upload - 400 Bad Request - File too large' },
  { id: 4, type: 'info', msg: '[System] Backup completed successfully in 230ms' },
  { id: 5, type: 'success', msg: 'GET /categories/productivity - 200 OK' },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 italic">
          控制台总览
        </h1>
        <p className="text-slate-500 font-mono text-sm mt-1 flex items-center gap-2">
          <span className="text-primary">$</span> 核心流量引擎已连接。正在实时解构全站访问轨迹与转换路径_
        </p>
      </div>

      <StatsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <GlassCard className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
              14 Day Traffic Trend
            </h3>
            <span className="text-xs text-slate-500 font-mono">Unit: Req/s</span>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F111A', borderColor: '#ffffff20', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="uv" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorUv)" />
                <Area type="monotone" dataKey="pv" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Side Panels */}
        <div className="space-y-6">
          {/* System Load */}
          <GlassCard>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]"></span>
              Core Load
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><Cpu size={12}/> CPU</span>
                  <span className="text-emerald-400 font-mono">12.4%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[12.4%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1"><MemoryStick size={12}/> RAM</span>
                  <span className="text-cyan-400 font-mono">440.1MB</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Realtime Logs */}
          <GlassCard className="flex-1 overflow-hidden relative" noPadding>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#0d0e16]">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Terminal size={14} /> Realtime Logs
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="p-4 font-mono text-[10px] space-y-2 h-[200px] overflow-y-auto custom-scrollbar">
              {mockLogs.map((log) => (
                <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                  <span className={`
                    ${log.type === 'success' ? 'text-emerald-500' : log.type === 'warning' ? 'text-amber-500' : 'text-blue-400'}
                  `}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span className="text-slate-300 truncate">{log.msg}</span>
                </div>
              ))}
              <div className="text-slate-600 animate-pulse">_</div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};