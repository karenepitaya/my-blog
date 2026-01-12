
import React, { useState, useEffect, useRef } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { 
  Terminal, Search, Trash2, Pause, Play, 
  AlertTriangle, Info, CheckCircle2, XCircle, Download, 
  Clock, Hash, ChevronDown, Activity, 
  LayoutTemplate, Shield, Server, Globe
} from 'lucide-react';
import { LogEntry, LogLevel, LogScope } from '../types';

// --- Visual Configuration ---
const SCOPE_UI_CONFIG = {
    FRONTEND: {
        label: '前台',
        icon: LayoutTemplate,
        color: 'text-pink-400',
        bg: 'bg-pink-500/10',
    },
    BACKEND: {
        label: '后台',
        icon: Shield,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
    },
    SERVER: {
        label: '服务器',
        icon: Server,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
    }
};

interface SystemLogViewerProps {
    logs: LogEntry[];
    isLive: boolean;
    bufferSize?: number;
    onToggleLive: () => void;
    onClear: () => void;
}

export const SystemLogViewer: React.FC<SystemLogViewerProps> = ({ 
    logs, 
    isLive, 
    bufferSize = 500,
    onToggleLive,
    onClear 
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLevel, setActiveLevel] = useState<'ALL' | LogLevel>('ALL');
    const [activeScope, setActiveScope] = useState<'ALL' | LogScope>('ALL');
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Auto scroll logic
    useEffect(() => {
        if (autoScroll && scrollContainerRef.current) {
            const { scrollHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [logs, autoScroll]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setAutoScroll(isNearBottom);
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              log.traceId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel = activeLevel === 'ALL' || log.level === activeLevel;
        const matchesScope = activeScope === 'ALL' || log.scope === activeScope;
        return matchesSearch && matchesLevel && matchesScope;
    });

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            {/* Header / Toolbar */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 flex items-center gap-3">
                        <Terminal className="text-primary" size={28} /> 系统日志
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border transition-colors ${isLive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse' : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'}`}>
                            <Activity size={10} /> {isLive ? '实时流' : '已暂停'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">缓存: {logs.length} / {bufferSize}</span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full xl:w-auto">
                     {/* Scope Filters */}
                     <div className="flex bg-[#0F111A] p-1 rounded-lg border border-white/10 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setActiveScope('ALL')}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap
                                ${activeScope === 'ALL' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}
                            `}
                        >
                            <Globe size={12} /> 全部
                        </button>
                        {Object.entries(SCOPE_UI_CONFIG).map(([key, config]) => {
                            const isActive = activeScope === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setActiveScope(key as LogScope)}
                                    className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all whitespace-nowrap
                                        ${isActive ? `${config.bg} ${config.color} border border-white/5` : 'text-slate-500 hover:text-slate-300'}
                                    `}
                                >
                                    <config.icon size={12} />
                                    {config.label}
                                </button>
                            );
                        })}
                     </div>

                     {/* Search */}
                    <div className="relative flex-1 md:w-64 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                            type="text" 
                            placeholder="搜索日志内容..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0F111A] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-primary/50 transition-all font-mono"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex bg-[#0F111A] rounded-lg border border-white/10 p-1 gap-1">
                        <button 
                            onClick={onToggleLive}
                            className={`p-1.5 rounded hover:bg-white/10 transition-colors ${!isLive ? 'text-yellow-400' : 'text-slate-400'}`}
                            title={isLive ? "暂停" : "恢复"}
                        >
                            {isLive ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                        <button 
                            onClick={onClear}
                            className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            title="清空"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button 
                            className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="下载"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Level Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
                {[
                    { id: 'ALL', label: '所有级别', icon: Hash, color: 'text-slate-400' },
                    { id: 'INFO', label: '信息 (INFO)', icon: Info, color: 'text-blue-400' },
                    { id: 'WARN', label: '警告 (WARN)', icon: AlertTriangle, color: 'text-yellow-400' },
                    { id: 'ERROR', label: '错误 (ERROR)', icon: XCircle, color: 'text-red-400' },
                    { id: 'SUCCESS', label: '成功 (SUCCESS)', icon: CheckCircle2, color: 'text-emerald-400' },
                ].map((level: any) => (
                    <button
                        key={level.id}
                        onClick={() => setActiveLevel(level.id)}
                        className={`
                            flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold font-mono transition-all border whitespace-nowrap
                            ${activeLevel === level.id 
                                ? 'bg-white/10 border-white/20 text-white shadow-sm' 
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'}
                        `}
                    >
                        <level.icon size={12} className={level.color} />
                        {level.label}
                    </button>
                ))}
            </div>

            {/* Terminal Window */}
            <GlassCard 
                noPadding 
                className="flex-1 overflow-hidden flex flex-col relative border-white/10 shadow-2xl bg-[#05060a]"
            >
                {/* CRT Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] opacity-20" />
                
                {/* Log Header */}
                <div className="flex items-center px-4 py-2 border-b border-white/5 bg-[#0B0C15] text-[10px] font-mono text-slate-500 uppercase tracking-wider select-none z-10 sticky top-0">
                    <div className="w-24 shrink-0">时间</div>
                    <div className="w-24 shrink-0">系统</div>
                    <div className="w-16 shrink-0 text-center">级别</div>
                    <div className="w-32 shrink-0">来源</div>
                    <div className="w-24 shrink-0">追踪ID</div>
                    <div className="flex-1">消息</div>
                </div>

                {/* Log List */}
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto custom-scrollbar p-2 font-mono text-xs space-y-0.5 z-10"
                >
                    {filteredLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                             <Terminal size={32} className="opacity-50"/>
                             <p>没有找到匹配的日志。</p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => {
                            const ScopeConfig = SCOPE_UI_CONFIG[log.scope];
                            const ScopeIcon = ScopeConfig ? ScopeConfig.icon : Globe;
                            const ScopeColor = ScopeConfig ? ScopeConfig.color : 'text-slate-400';

                            return (
                                <div 
                                    key={log.id} 
                                    className="flex items-start gap-4 px-2 py-1.5 hover:bg-white/[0.03] rounded transition-colors group border-l-2 border-transparent hover:border-white/10"
                                >
                                    {/* Time */}
                                    <div className="w-24 shrink-0 text-slate-500 opacity-70 flex items-center gap-1.5">
                                        <Clock size={10} />
                                        {log.timestamp.split('T')[1].replace('Z', '')}
                                    </div>
                                    
                                    {/* System Scope */}
                                    <div className={`w-24 shrink-0 flex items-center gap-1.5 font-bold text-[10px] ${ScopeColor}`}>
                                        <ScopeIcon size={10} />
                                        {log.scope}
                                    </div>

                                    {/* Level */}
                                    <div className="w-16 shrink-0 text-center">
                                        <span className={`
                                            inline-block w-full text-[9px] font-bold rounded px-1 py-0.5 border
                                            ${log.level === 'INFO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                              log.level === 'WARN' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                              log.level === 'ERROR' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' :
                                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}
                                        `}>
                                            {log.level}
                                        </span>
                                    </div>

                                    {/* Source */}
                                    <div className="w-32 shrink-0 text-slate-400 truncate" title={log.source}>
                                        {log.source}
                                    </div>

                                    {/* Trace ID */}
                                    <div className="w-24 shrink-0 text-slate-600 text-[10px] select-all cursor-text" title="Trace ID">
                                        #{log.traceId}
                                    </div>

                                    {/* Message */}
                                    <div className={`flex-1 min-w-0 break-all ${
                                        log.level === 'ERROR' ? 'text-red-300' : 
                                        log.level === 'WARN' ? 'text-yellow-100' : 'text-slate-300'
                                    }`}>
                                        {log.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Status Footer */}
                {!autoScroll && (
                    <div 
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs px-4 py-1.5 rounded-full shadow-lg cursor-pointer z-30 flex items-center gap-2 animate-bounce hover:bg-primary/90"
                        onClick={() => { 
                            setAutoScroll(true); 
                            if(scrollContainerRef.current) {
                                scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' });
                            }
                        }}
                    >
                        <ChevronDown size={14} /> 恢复自动滚动
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
