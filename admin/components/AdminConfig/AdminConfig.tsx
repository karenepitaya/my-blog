import React, { useEffect, useMemo, useState } from 'react';
import type { SystemConfig } from '../../types';
import { SettingsTab } from './types';
import { ProfileTab } from './tabs/ProfileTab';
import { SystemTab } from './tabs/SystemTab';
import { InfraTab } from './tabs/InfraTab';
import { User, Server, ChevronRight, Settings2, Lightbulb } from 'lucide-react';
import { AdminConfigDraftService } from './services/adminConfigDraft';

interface AdminConfigProps {
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onUploadFavicon: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

const TIPS = [
  "开启 '增强型 SEO' 可显著提升搜索引擎收录率。",
  "基础设施配置变更后，建议手动重启相关节点。",
  "您可以随时在顶部导航栏切换 Admin / Author 视图。",
  "定期清理 '回收站' 可释放数据库存储空间。"
];

const AdminConfig: React.FC<AdminConfigProps> = ({ config, onUpdate, onUploadFavicon, onTestOssUpload }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [tipIndex, setTipIndex] = useState(0);
  const [draft, setDraft] = useState(() => {
    const saved = AdminConfigDraftService.load() ?? AdminConfigDraftService.createDefault();
    return AdminConfigDraftService.mergeSystemConfig(saved, config);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = AdminConfigDraftService.load() ?? AdminConfigDraftService.createDefault();
    setDraft(AdminConfigDraftService.mergeSystemConfig(saved, config));
  }, [config]);

  const systemTabInput = useMemo(() => ({ frontend: draft.system.frontend, backend: draft.system.backend }), [draft]);
  const infraTabInput = useMemo(() => ({ ...draft.infra }), [draft]);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight">
          系统设置
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* --- Sidebar Nav --- */}
        <div className="md:col-span-3 sticky top-6">
          <div className="bg-[#44475a]/30 backdrop-blur-sm rounded-xl p-1.5 border border-white/5 space-y-1">
             
             <button 
                onClick={() => setActiveTab('PROFILE')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'PROFILE' 
                    ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(189,147,249,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <User size={16} className={activeTab === 'PROFILE' ? 'text-primary' : ''} />
                <span className="text-sm font-medium">管理员资料</span>
                {activeTab === 'PROFILE' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('SYSTEM')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'SYSTEM' 
                    ? 'bg-secondary/20 text-secondary shadow-[0_0_15px_rgba(139,233,253,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <Settings2 size={16} className={activeTab === 'SYSTEM' ? 'text-secondary' : ''} />
                <span className="text-sm font-medium">应用系统配置</span>
                {activeTab === 'SYSTEM' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('INFRA')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'INFRA' 
                    ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(255,121,198,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <Server size={16} className={activeTab === 'INFRA' ? 'text-accent' : ''} />
                <span className="text-sm font-medium">基础设施</span>
                {activeTab === 'INFRA' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lightbulb size={48} />
             </div>
             <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-1 rounded bg-secondary/20 text-secondary">
                    <Lightbulb size={14} />
                </div>
                <h4 className="text-xs font-bold text-[#f8f8f2]">配置贴士</h4>
             </div>
             <div className="relative h-12">
                 {TIPS.map((tip, i) => (
                     <p 
                        key={i} 
                        className={`
                            text-[11px] text-[#6272a4] leading-relaxed absolute top-0 left-0 w-full transition-all duration-500
                            ${i === tipIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                        `}
                     >
                       {tip}
                     </p>
                 ))}
             </div>
             <div className="flex gap-1 mt-2 relative z-10">
                 {TIPS.map((_, i) => (
                     <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${i === tipIndex ? 'w-4 bg-secondary/50' : 'w-1.5 bg-white/10'}`} 
                     />
                 ))}
             </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="md:col-span-9 min-h-[500px]">
          {activeTab === 'PROFILE' && <ProfileTab />}
          {activeTab === 'SYSTEM' && (
            <SystemTab
              initialFrontend={systemTabInput.frontend}
              initialBackend={systemTabInput.backend}
              onUploadFavicon={onUploadFavicon}
              onCommit={async (next) => {
                const nextDraft = { ...draft, system: next };
                AdminConfigDraftService.save(nextDraft);
                setDraft(nextDraft);
                const nextConfig = AdminConfigDraftService.applyToSystemConfig(config, nextDraft);
                const updated = await onUpdate(nextConfig);
                if (updated) {
                  const merged = AdminConfigDraftService.mergeSystemConfig(nextDraft, updated);
                  AdminConfigDraftService.save(merged);
                  setDraft(merged);
                }
              }}
            />
          )}
          {activeTab === 'INFRA' && (
            <InfraTab
              initialInfra={infraTabInput}
              onTestOssUpload={onTestOssUpload}
              onCommit={async (next) => {
                const nextDraft = { ...draft, infra: next };
                AdminConfigDraftService.save(nextDraft);
                setDraft(nextDraft);
                const nextConfig = AdminConfigDraftService.applyToSystemConfig(config, nextDraft);
                const updated = await onUpdate(nextConfig);
                if (updated) {
                  const merged = AdminConfigDraftService.mergeSystemConfig(nextDraft, updated);
                  AdminConfigDraftService.save(merged);
                  setDraft(merged);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
