import React, { useEffect, useState } from 'react';
import { ChevronRight, Lightbulb, Server, Settings2, User } from 'lucide-react';
import type { SystemConfig } from '../../types';
import type { User as AdminUser } from '../../types';
import { IconLabel } from '../IconLabel';
import { ProfileTab } from './tabs/ProfileTab';
import { SystemTab } from './tabs/SystemTab';
import { InfraTab } from './tabs/InfraTab';

export interface AdminSettingsProps {
  token: string;
  user: AdminUser;
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onPublish: (config: SystemConfig) => Promise<SystemConfig | null>;
  onPreviewTheme: (input: {
    themes: SystemConfig['frontend']['themes'];
    enableSeasonEffect?: boolean;
    seasonEffectType?: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
    seasonEffectIntensity?: number;
  }) => Promise<{ path: string } | null>;
  onPreviewAll: (config: SystemConfig) => Promise<{ previewPath: string; frontendSiteConfigPath: string; appliedAt: number } | null>;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onUploadFavicon: (file: File) => Promise<string>;
  onUploadCharacterAvatar: (file: File) => Promise<string>;
  onUploadAvatar: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

type SettingsTab = 'PROFILE' | 'SYSTEM' | 'INFRA';

const TIPS = [
  "开启 '增强型 SEO' 可显著提升搜索引擎收录率。",
  '基础设施配置变更后，建议手动重启相关节点。',
  "定期清理 '回收站' 可释放数据库存储空间。",
];

const AdminSettings: React.FC<AdminSettingsProps> = ({
  token,
  user,
  config,
  onUpdate,
  onPublish,
  onPreviewTheme,
  onPreviewAll,
  onUpdateProfile,
  onUploadFavicon,
  onUploadCharacterAvatar,
  onUploadAvatar,
  onTestOssUpload,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('PROFILE');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight">
          系统配置中心
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-3 sticky top-6">
          <div className="bg-[#44475a]/30 backdrop-blur-sm rounded-xl p-1.5 border border-white/5 space-y-1">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group',
                activeTab === 'PROFILE'
                  ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(189,147,249,0.1)]'
                  : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'
              )}
            >
              <IconLabel
                icon={<User size={16} className={activeTab === 'PROFILE' ? 'text-primary' : ''} />}
                label="个人资料"
                labelSize="base"
                labelClassName="!font-medium"
              />
              {activeTab === 'PROFILE' && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>

            <button
              onClick={() => setActiveTab('SYSTEM')}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group',
                activeTab === 'SYSTEM'
                  ? 'bg-secondary/20 text-secondary shadow-[0_0_15px_rgba(139,233,253,0.1)]'
                  : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'
              )}
            >
              <IconLabel
                icon={<Settings2 size={16} className={activeTab === 'SYSTEM' ? 'text-secondary' : ''} />}
                label="应用配置"
                labelSize="base"
                labelClassName="!font-medium"
              />
              {activeTab === 'SYSTEM' && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>

            <button
              onClick={() => setActiveTab('INFRA')}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group',
                activeTab === 'INFRA'
                  ? 'bg-accent/20 text-accent shadow-[0_0_15px_rgba(255,121,198,0.1)]'
                  : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'
              )}
            >
              <IconLabel
                icon={<Server size={16} className={activeTab === 'INFRA' ? 'text-accent' : ''} />}
                label="基础设施"
                labelSize="base"
                labelClassName="!font-medium"
              />
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
              <h4 className="text-base font-bold text-[#f8f8f2]">配置贴士</h4>
            </div>
            <div className="relative h-16">
              {TIPS.map((tip, i) => (
                <p
                  key={`${i}-${tip}`}
                  className={`
                    text-base text-[#6272a4] leading-relaxed absolute top-0 left-0 w-full transition-all duration-500
                    ${i === tipIndex ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
                  `}
                >
                  {tip}
                </p>
              ))}
            </div>
            <div className="flex gap-1 mt-2 relative z-10">
              {TIPS.map((tip, i) => (
                <div
                  key={`${tip}-${i}`}
                  className={`h-1 rounded-full transition-all duration-500 ${i === tipIndex ? 'w-4 bg-secondary/50' : 'w-1.5 bg-white/10'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-9 min-h-[500px]">
          {activeTab === 'PROFILE' && (
            <ProfileTab user={user} onUpdateProfile={onUpdateProfile} onUploadAvatar={onUploadAvatar} />
          )}
          {activeTab === 'SYSTEM' && (
            <SystemTab
              config={config}
              onUpdate={onUpdate}
              onPublish={onPublish}
              onPreviewTheme={onPreviewTheme}
              onPreviewAll={onPreviewAll}
              onUploadFavicon={onUploadFavicon}
              onUploadCharacterAvatar={onUploadCharacterAvatar}
            />
          )}
          {activeTab === 'INFRA' && (
            <InfraTab config={config} onUpdate={onUpdate} onTestOssUpload={onTestOssUpload} />
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}

export default AdminSettings;
