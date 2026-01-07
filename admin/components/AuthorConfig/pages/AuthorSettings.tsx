import React, { useState, useEffect } from 'react';
import { AuthorSettingsTab } from '../types';
import { AuthorProfileTab } from '../components/author-settings/AuthorProfileTab';
import { AuthorModelTab } from '../components/author-settings/AuthorModelTab';
import { AuthorSecurityTab } from '../components/author-settings/AuthorSecurityTab';
import { User, Sparkles, ShieldCheck, ChevronRight, Lightbulb } from 'lucide-react';
import type { User as AdminUser } from '../../../types';

interface AuthorSettingsProps {
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
    prompt?: string | null;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
  onFetchAiModels: (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
  }) => Promise<{ models: string[]; latencyMs: number }>;
}

const AUTHOR_TIPS = [
  "使用 AI 润色功能可以快速提升标题吸引力。",
  "写作时开启“禅模式”可以屏蔽系统通知。",
  "草稿箱内容每 30 秒自动同步到云端。",
  "尝试夜间主题写作，灵感更易迫发。",
];

export const AuthorSettings: React.FC<AuthorSettingsProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  onUpdateAiConfig,
  onUploadAvatar,
  onFetchAiModels,
}) => {
  const [activeTab, setActiveTab] = useState<AuthorSettingsTab>('PROFILE');
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % AUTHOR_TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight">
          作者工作台
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
                <span className="text-base font-medium">个人资料</span>
                {activeTab === 'PROFILE' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('AI_CONFIG')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'AI_CONFIG' 
                    ? 'bg-secondary/20 text-secondary shadow-[0_0_15px_rgba(139,233,253,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <Sparkles size={16} className={activeTab === 'AI_CONFIG' ? 'text-secondary' : ''} />
                <span className="text-base font-medium">AI 模型配置</span>
                {activeTab === 'AI_CONFIG' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>

             <button 
                onClick={() => setActiveTab('SECURITY')}
                className={`
                  w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all duration-300 group
                  ${activeTab === 'SECURITY' 
                    ? 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-white/5'}
                `}
             >
                <ShieldCheck size={16} className={activeTab === 'SECURITY' ? 'text-emerald-500' : ''} />
                <span className="text-base font-medium">安全设置</span>
                {activeTab === 'SECURITY' && <ChevronRight size={14} className="ml-auto opacity-50" />}
             </button>
          </div>
          
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/10 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <Lightbulb size={48} className="text-pink-500" />
             </div>
             <div className="flex items-center gap-2 mb-3 relative z-10">
                <div className="p-1 rounded bg-pink-500/20 text-pink-500">
                    <Lightbulb size={14} />
                </div>
                <h4 className="text-base font-bold text-[#f8f8f2]">创作贴士</h4>
             </div>
             <div className="relative h-16">
                 {AUTHOR_TIPS.map((tip, i) => (
                     <p 
                        key={i} 
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
                 {AUTHOR_TIPS.map((_, i) => (
                     <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${i === tipIndex ? 'w-4 bg-pink-500/50' : 'w-1.5 bg-white/10'}`} 
                     />
                 ))}
             </div>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="md:col-span-9 min-h-[500px]">
          {activeTab === 'PROFILE' && (
            <AuthorProfileTab
              user={user}
              onUpdateProfile={onUpdateProfile}
              onUploadAvatar={onUploadAvatar}
            />
          )}
          {activeTab === 'AI_CONFIG' && (
            <AuthorModelTab
              config={user.preferences?.aiConfig}
              onUpdateAiConfig={onUpdateAiConfig}
              onFetchAiModels={onFetchAiModels}
            />
          )}
          {activeTab === 'SECURITY' && <AuthorSecurityTab onChangePassword={onChangePassword} />}
        </div>
      </div>
    </div>
  );
};
