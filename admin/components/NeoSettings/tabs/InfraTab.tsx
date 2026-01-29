import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { NeonButton } from '../../NeoShared/ui/NeonButton';
import { CyberInput } from '../../NeoShared/ui/CyberInput';
import { ConfirmModal } from '../../NeoShared/ui/ConfirmModal';
import { useNeoToast } from '../../NeoShared/ui/Toast';
import { DatabaseConfig, ServerRuntimeConfig, OSSConfig, AnalyticsConfig, LogConfig } from '../types';
import type { StatsTool, SystemConfig as RealSystemConfig } from '../../../types';
import { 
  Database, Cpu, CheckCircle2, RefreshCw, HardDrive, Cloud, 
  BarChart2, FileText, Activity, ShieldCheck, Zap, Server, Save, Lock, Unlock, AlertTriangle, Info
} from 'lucide-react';

// --- Mocks ---
const MOCK_DB: DatabaseConfig = {
  host: 'mongo-cluster-01.internal',
  port: 27017,
  username: 'admin',
  dbname: 'multiterm_core',
  enableStatusCollection: true
};

const MOCK_SERVER: ServerRuntimeConfig = {
  port: 3000,
  enableSecurityFilter: true,
  enableGzip: true
};

const MOCK_OSS: OSSConfig = {
  provider: 'oss',
  endpoint: 'oss-cn-hangzhou.aliyuncs.com',
  bucket: 'my-blog-assets',
  accessKey: 'LTxxxxxxxx',
  secretKey: 'xxxxxxxx',
  region: 'oss-cn-hangzhou',
  customDomain: 'https://cdn.example.com'
};

const MOCK_ANALYTICS: AnalyticsConfig = {
    tool: 'INTERNAL',
    apiEndpoint: '/api/v1/metrics'
};

const MOCK_LOGS: LogConfig = {
    storagePath: '/var/log/multiterm',
    retentionDays: 30,
    collectionInterval: 60
};

// --- Helper ---
const SectionHeader = ({ icon: Icon, title, statusColor = 'text-muted' }: any) => (
    <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
      <Icon size={18} className={statusColor} />
      <h3 className="text-base font-semibold tracking-wide text-fg">{title}</h3>
    </div>
);

const StatusIndicator = ({ status }: { status: 'idle' | 'checking' | 'ok' | 'err' }) => (
    <div className={`px-2 py-0.5 rounded text-xs font-mono border ${
        status === 'ok' ? 'bg-success/10 text-success border-success/20' :
        status === 'err' ? 'bg-danger/10 text-danger border-danger/20' :
        status === 'checking' ? 'bg-warning/10 text-warning border-warning/20' :
        'bg-surface/60 text-muted border-border'
    }`}>
        {status === 'checking' ? '测试中...' : status === 'ok' ? '正常' : status === 'err' ? '异常' : '待检测'}
    </div>
);

export type InfraTabProps = {
    config: RealSystemConfig;
    onUpdate: (config: RealSystemConfig) => Promise<RealSystemConfig | null>;
    onTestOssUpload: () => Promise<string>;
};

const SUPPORTED_STATS_TOOLS: StatsTool[] = ['INTERNAL', 'GA4', 'UMAMI'];

const toUiOss = (config: RealSystemConfig): OSSConfig => ({
    ...MOCK_OSS,
    provider: config.oss?.provider ?? MOCK_OSS.provider,
    endpoint: config.oss?.endpoint ?? '',
    bucket: config.oss?.bucket ?? '',
    accessKey: config.oss?.accessKey ?? '',
    secretKey: config.oss?.secretKey ?? '',
    region: config.oss?.region ?? '',
    customDomain: config.oss?.customDomain ?? '',
});

const toUiAnalytics = (config: RealSystemConfig): AnalyticsConfig => ({
    ...MOCK_ANALYTICS,
    tool: config.admin?.statsTool ?? MOCK_ANALYTICS.tool,
    apiEndpoint: config.admin?.statsApiEndpoint ?? MOCK_ANALYTICS.apiEndpoint,
});

const buildNextConfig = (base: RealSystemConfig, oss: OSSConfig, analytics: AnalyticsConfig): RealSystemConfig => {
    const nextTool = SUPPORTED_STATS_TOOLS.includes(analytics.tool as StatsTool)
        ? (analytics.tool as StatsTool)
        : base.admin.statsTool;
    const nextEndpoint = String(analytics.apiEndpoint ?? '').trim() || base.admin.statsApiEndpoint;

    return {
        ...base,
        oss: {
            ...base.oss,
            provider: oss.provider,
            endpoint: oss.endpoint || undefined,
            bucket: oss.bucket || undefined,
            accessKey: oss.accessKey || undefined,
            secretKey: oss.secretKey || undefined,
            region: oss.region || undefined,
            customDomain: oss.customDomain || undefined,
        },
        admin: {
            ...base.admin,
            statsTool: nextTool,
            statsApiEndpoint: nextEndpoint,
        },
    };
};

export const InfraTab: React.FC<InfraTabProps> = ({ config, onUpdate, onTestOssUpload }) => {
    const toast = useNeoToast();
    const [db, setDb] = useState(MOCK_DB);
    const [server, setServer] = useState(MOCK_SERVER);
    const [oss, setOss] = useState<OSSConfig>(() => toUiOss(config));
    const [analytics, setAnalytics] = useState<AnalyticsConfig>(() => toUiAnalytics(config));
    const [logs, setLogs] = useState(MOCK_LOGS);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'checking' | 'ok' | 'err'>>({});

    useEffect(() => {
        if (isEditing) return;
        setOss(toUiOss(config));
        setAnalytics(toUiAnalytics(config));
    }, [config, isEditing]);

    const runTest = async (key: string) => {
        if (testStatus[key] === 'checking') return;
        setTestStatus(p => ({...p, [key]: 'checking'}));
        if (key === 'oss') {
            try {
                await onTestOssUpload();
                setTestStatus(p => ({...p, [key]: 'ok'}));
                toast.success('OSS 上传测试成功');
            } catch (err: any) {
                setTestStatus(p => ({...p, [key]: 'err'}));
                toast.error(err?.message ? String(err.message) : 'OSS 上传测试失败');
            }
            return;
        }
        setTimeout(() => {
            setTestStatus(p => ({...p, [key]: Math.random() > 0.2 ? 'ok' : 'err'}));
        }, 1200);
    };

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setShowSaveConfirm(false);
        try {
            const nextConfig = buildNextConfig(config, oss, analytics);
            const updated = await onUpdate(nextConfig);
            if (updated) {
                setOss(toUiOss(updated));
                setAnalytics(toUiAnalytics(updated));
            }
            setIsEditing(false); // Auto lock
            toast.success('基础设施配置已保存');
        } catch (err: any) {
            toast.error(err?.message ? String(err.message) : '保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
             {/* Header */}
             <div className="flex items-center justify-between bg-surface2/60 p-4 rounded-2xl border border-border backdrop-blur-sm sticky top-2 z-20 shadow-lg mx-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg text-accent"><Server size={20} /></div>
                    <h3 className="text-base font-semibold text-fg">基础设施配置</h3>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors
                        ${isEditing ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-fg/5 border-border text-muted'}
                    `}>
                        {isEditing ? <Unlock size={14}/> : <Lock size={14}/>}
                        <span>{isEditing ? '编辑模式' : '只读模式'}</span>
                    </div>

                    {!isEditing ? (
                         <NeonButton variant="secondary" onClick={() => setIsEditing(true)} icon={<RefreshCw size={14}/>}>
                            编辑配置
                         </NeonButton>
                    ) : (
                         <div className="flex gap-2">
                            <NeonButton variant="ghost" onClick={() => setIsEditing(false)}>取消</NeonButton>
                            <NeonButton variant="primary" onClick={() => setShowSaveConfirm(true)} icon={isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}>
                                {isSaving ? '保存中...' : '保存'}
                            </NeonButton>
                         </div>
                    )}
                </div>
            </div>

            {/* Forced Single Column Layout */}
            <div className="flex flex-col gap-8">
                
                {/* 1. SERVER CONFIG */}
                <GlassCard className="w-full">
                    <SectionHeader icon={Cpu} title="服务器环境" statusColor="text-warning" />
                    <div className="space-y-6">
                         <div className="flex justify-between items-center bg-fg/3 p-3 rounded-lg border border-border">
                             <span className="text-xs text-muted">连接状态检测</span>
                             <div className="flex gap-2">
                                 <StatusIndicator status={testStatus['server'] || 'idle'} />
                                 <button onClick={() => runTest('server')} className="text-muted hover:text-fg"><RefreshCw size={14}/></button>
                             </div>
                         </div>
                         
                         <CyberInput type="number" label="服务端口" value={server.port} disabled={!isEditing} onChange={e => setServer({...server, port: parseInt(e.target.value)})} className="font-mono text-warning" />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div 
                                onClick={() => isEditing && setServer({...server, enableSecurityFilter: !server.enableSecurityFilter})}
                                className={`
                                    p-4 rounded-xl border transition-all 
                                    ${server.enableSecurityFilter ? 'bg-success/10 border-success/30' : 'bg-fg/5 border-border opacity-50'}
                                    ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'}
                                `}
                             >
                                 <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-fg"><ShieldCheck size={16}/> 安全防护</div>
                             <span className="text-xs text-muted">开启 SQL 注入防御与 XSS 过滤</span>
                             </div>
                             <div 
                                onClick={() => isEditing && setServer({...server, enableGzip: !server.enableGzip})}
                                className={`
                                    p-4 rounded-xl border transition-all 
                                    ${server.enableGzip ? 'bg-secondary/10 border-secondary/30' : 'bg-fg/5 border-border opacity-50'}
                                    ${!isEditing ? 'cursor-not-allowed' : 'cursor-pointer'}
                                `}
                             >
                                 <div className="flex items-center gap-2 mb-1 text-sm font-semibold text-fg"><Zap size={16}/> 性能优化</div>
                                 <span className="text-xs text-muted">启用 Gzip 压缩与静态资源缓存</span>
                             </div>
                         </div>
                    </div>
                </GlassCard>

                {/* 2. DATABASE CONFIG */}
                <GlassCard className="w-full">
                    <SectionHeader icon={Database} title="数据库 (MongoDB)" statusColor="text-success" />
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-fg/3 p-3 rounded-lg border border-border">
                             <span className="text-sm text-muted">连接状态检测</span>
                             <div className="flex gap-2">
                                 <StatusIndicator status={testStatus['db'] || 'idle'} />
                                 <button onClick={() => runTest('db')} className="text-muted hover:text-fg"><RefreshCw size={14}/></button>
                             </div>
                         </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CyberInput label="主机地址" value={db.host} disabled={!isEditing} onChange={e => setDb({...db, host: e.target.value})} />
                            <CyberInput label="端口" type="number" value={db.port} disabled={!isEditing} onChange={e => setDb({...db, port: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CyberInput label="用户名" value={db.username} disabled={!isEditing} onChange={e => setDb({...db, username: e.target.value})} />
                            <CyberInput label="数据库名" value={db.dbname} disabled={!isEditing} onChange={e => setDb({...db, dbname: e.target.value})} />
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-xl border border-border bg-fg/3 ${!isEditing && 'opacity-80'}`}>
                             <div className="flex items-center gap-2 text-sm font-semibold text-fg">
                                 <Activity size={14} className="text-primary"/> 启用状态采集与监控
                             </div>
                             <input type="checkbox" className="accent-primary" checked={db.enableStatusCollection} disabled={!isEditing} onChange={e => setDb({...db, enableStatusCollection: e.target.checked})} />
                        </div>
                    </div>
                </GlassCard>

                {/* 3. OSS CONFIG */}
                <GlassCard className="w-full">
                    <SectionHeader icon={Cloud} title="对象存储 (OSS)" statusColor="text-secondary" />
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-fg/3 p-3 rounded-lg border border-border">
                             <span className="text-sm text-muted">上传功能检测</span>
                             <div className="flex gap-2">
                                 <StatusIndicator status={testStatus['oss'] || 'idle'} />
                                 <button onClick={() => runTest('oss')} className="text-muted hover:text-fg"><RefreshCw size={14}/></button>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="col-span-1 md:col-span-2">
                                <label className="text-sm font-medium text-muted mb-2 block">存储提供商</label>
                                <select 
                                    className={`w-full bg-surface text-fg text-base border border-border rounded-xl p-3 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                    value={oss.provider}
                                    disabled={!isEditing}
                                    onChange={e => setOss({...oss, provider: e.target.value as any})}
                                >
                                    <option value="oss">阿里云 OSS</option>
                                    <option value="minio">MinIO (S3 Compatible)</option>
                                </select>
                             </div>
                             <CyberInput label="服务端点" value={oss.endpoint} disabled={!isEditing} onChange={e => setOss({...oss, endpoint: e.target.value})} />
                             <CyberInput label="存储桶" value={oss.bucket} disabled={!isEditing} onChange={e => setOss({...oss, bucket: e.target.value})} />
                             <CyberInput label="访问密钥 (AK)" type="password" value={oss.accessKey} disabled={!isEditing} onChange={e => setOss({...oss, accessKey: e.target.value})} />
                             <CyberInput label="安全密钥 (SK)" type="password" value={oss.secretKey} disabled={!isEditing} onChange={e => setOss({...oss, secretKey: e.target.value})} />
                             <CyberInput label="自定义域名" className="col-span-1 md:col-span-2" value={oss.customDomain} disabled={!isEditing} onChange={e => setOss({...oss, customDomain: e.target.value})} />
                        </div>
                    </div>
                </GlassCard>

                {/* 4. ANALYTICS & LOGS */}
                <div className="flex flex-col gap-8">
                     {/* Analytics */}
                     <GlassCard className="w-full">
                         <SectionHeader icon={BarChart2} title="流量统计" statusColor="text-accent" />
                         <div className="space-y-6">
                             <div className="grid grid-cols-3 gap-2">
                                 {['INTERNAL', 'GA4', 'UMAMI', 'BAIDU'].map(t => (
                                     <button 
                                        key={t}
                                        disabled={!isEditing}
                                        onClick={() => setAnalytics({...analytics, tool: t as any})}
                                        className={`
                                            py-2 rounded-lg text-xs font-bold border transition-all
                                            ${analytics.tool === t ? 'bg-accent/20 border-accent text-fg' : 'border-border text-muted hover:bg-fg/5'}
                                            ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                        `}
                                     >
                                         {t === 'INTERNAL' ? '内置' : t === 'BAIDU' ? '百度统计' : t}
                                     </button>
                                 ))}
                             </div>
                             <CyberInput label="API 接口地址 / 站点 ID" value={analytics.apiEndpoint} disabled={!isEditing} onChange={e => setAnalytics({...analytics, apiEndpoint: e.target.value})} />
                         </div>
                     </GlassCard>

                     {/* Logs */}
                     <GlassCard className="w-full">
                         <SectionHeader icon={FileText} title="日志管理" statusColor="text-muted" />
                         <div className="space-y-6">
                             <CyberInput label="日志存储路径" value={logs.storagePath} disabled={!isEditing} onChange={e => setLogs({...logs, storagePath: e.target.value})} className="font-mono text-xs" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <CyberInput type="number" label="保留时长 (天)" value={logs.retentionDays} disabled={!isEditing} onChange={e => setLogs({...logs, retentionDays: parseInt(e.target.value)})} />
                                 <CyberInput type="number" label="采集间隔 (秒)" value={logs.collectionInterval} disabled={!isEditing} onChange={e => setLogs({...logs, collectionInterval: parseInt(e.target.value)})} />
                             </div>
                             <div className="flex items-center gap-2 text-sm text-muted mt-2">
                                 <HardDrive size={12} />
                                 <span>当前磁盘占用: 450MB / 20GB</span>
                             </div>
                         </div>
                     </GlassCard>
                </div>

            </div>

            {/* Save Confirmation */}
            <ConfirmModal 
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={handleSave}
                title="保存基础设施配置"
                message="修改数据库、存储或服务器配置可能会导致服务短暂不可用。请确认连接参数正确无误。"
                type="primary"
                confirmText="保存更改"
            />
        </div>
    );
};
