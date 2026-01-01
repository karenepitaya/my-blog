import React, { useState } from 'react';
import { SettingsTab } from '../types';
import { ProfileTab } from '../components/settings/ProfileTab';
import { ModelTab } from '../components/settings/ModelTab';
import { SecurityTab } from '../components/settings/SecurityTab';
import { User, Cpu, Shield, ChevronRight, Lightbulb } from 'lucide-react';
import type { User as AdminUser } from '../../../types';

interface SettingsProps {
  user: AdminUser;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  onUpdateAiConfig: (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
  onFetchAiModels: (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
  }) => Promise<{ models: string[]; latencyMs: number }>;
  showHeader?: boolean;
  fullWidth?: boolean;
}

export const Settings: React.FC<SettingsProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  onUpdateAiConfig,
  onUploadAvatar,
  onFetchAiModels,
  showHeader = true,
  fullWidth = false,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('ACCOUNT');

  return (
    <div className={fullWidth ? 'animate-fade-in w-full' : 'animate-fade-in max-w-5xl mx-auto'}>
      {showHeader && (
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 font-mono italic tracking-tight">
            系统偏好设置
          </h1>
          <p className="text-[#6272a4] font-mono text-sm mt-2">
            <span className="text-primary">$</span> config --global user.profile && ai.connect
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* --- Sidebar Nav --- */}
        <div className="md:col-span-3 sticky top-6">
          <div className="bg-[#44475a]/30 backdrop-blur-sm rounded-xl p-1.5 border border-white/5 space-y-1">
             
             <button 
                onClick={() => setActiveTab('ACCOUNT')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'ACCOUNT' 
                    ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(189,147,249,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <User size={16} className={activeTab === 'ACCOUNT' ? 'text-primary' : ''} />
                <span className="text-sm font-medium">个人资料</span>
                {activeTab === 'ACCOUNT' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('AI_MODELS')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'AI_MODELS' 
                    ? 'bg-success/20 text-success shadow-[0_0_15px_rgba(80,250,123,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <Cpu size={16} className={activeTab === 'AI_MODELS' ? 'text-success' : ''} />
                <span className="text-sm font-medium">AI 模型配置</span>
                {activeTab === 'AI_MODELS' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'SECURITY' 
                    ? 'bg-danger/20 text-danger shadow-[0_0_15px_rgba(255,85,85,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <Shield size={16} className={activeTab === 'SECURITY' ? 'text-danger' : ''} />
                <span className="text-sm font-medium">账户安全</span>
                {activeTab === 'SECURITY' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-white/5">
             <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={14} className="text-warning" />
                <h4 className="text-xs font-bold text-[#f8f8f2]">小贴士</h4>
             </div>
             <p className="text-[11px] text-[#6272a4] leading-relaxed">
               设置准确的“心情状态 (Emoji)”可以帮助 AI 在生成草稿时更好地调整语气风格。
             </p>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="md:col-span-9 min-h-[500px]">
          {activeTab === 'ACCOUNT' && (
            <ProfileTab
              user={user}
              onUpdateProfile={onUpdateProfile}
              onUploadAvatar={onUploadAvatar}
            />
          )}
          {activeTab === 'AI_MODELS' && (
            <ModelTab
              config={user.preferences?.aiConfig}
              onUpdateAiConfig={onUpdateAiConfig}
              onFetchModels={onFetchAiModels}
            />
          )}
          {activeTab === 'SECURITY' && (
            <SecurityTab onChangePassword={onChangePassword} />
          )}
        </div>
      </div>
    </div>
  );
};
