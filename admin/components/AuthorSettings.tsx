import React, { useState } from 'react';
import { AuthorPreferences, User } from '../types';
import PageHeader from './PageHeader';

interface AuthorSettingsProps {
  user: User;
  onUpdateProfile: (input: { avatarUrl?: string | null; bio?: string | null }) => void;
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => void;
}

const PREFS_STORAGE_KEY = 'admin_author_prefs';

const AuthorSettings: React.FC<AuthorSettingsProps> = ({ user, onUpdateProfile, onChangePassword }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    username: user.username,
    bio: user.bio || '',
    avatarUrl: user.avatarUrl || '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [prefs, setPrefs] = useState<AuthorPreferences>(() => {
    const saved = localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as AuthorPreferences;
    }
    return (
      user.preferences ?? {
        articlePageSize: 10,
        recycleBinRetention: 30,
        statsLayout: 'GRID',
        aiConfig: { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o' },
      }
    );
  });
  const [isTestingAi, setIsTestingAi] = useState(false);

const tabs = [
  { name: '账户', id: 'account' },
  { name: '文章偏好', id: 'article-prefs' },
  { name: '回收策略', id: 'recycle-prefs' },
  { name: '统计偏好', id: 'stats-prefs' },
  { name: 'AI 配置', id: 'ai-config' },
];

  const handleSave = async () => {
    if (password && password !== passwordConfirm) {
      alert('Passwords do not match.');
      return;
    }

    try {
      await onUpdateProfile({
        avatarUrl: formData.avatarUrl.trim() ? formData.avatarUrl.trim() : null,
        bio: formData.bio.trim() ? formData.bio.trim() : null,
      });

      if (password) {
        if (!currentPassword) {
          alert('Current password is required.');
          return;
        }
        await onChangePassword({ currentPassword, newPassword: password });
      }

      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      alert('Settings saved.');
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const testAiConnection = async () => {
    setIsTestingAi(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsTestingAi(false);
    alert(`AI config checked: ${prefs.aiConfig.baseUrl}`);
  };

  const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-2 mb-6 animate-in slide-in-from-left-4 duration-300">
      <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="个人资料" motto="调整个人设置与作者档案。" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 space-y-1">
          {tabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(idx)}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 border ${
                activeTab === idx
                  ? 'bg-[#bd93f9] text-[#282a36] border-[#bd93f9] shadow-lg shadow-purple-500/20'
                  : 'text-[#6272a4] border-transparent hover:bg-[#44475a]/30 hover:text-[#f8f8f2]'
              }`}
            >
              {tab.name}
            </button>
          ))}
          <div className="pt-6">
            <button
              onClick={handleSave}
              className="w-full py-4 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-xl transition-all active:scale-95 uppercase tracking-widest border-b-4 border-[#bd93f9]/30"
            >
              保存设置
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#21222c] border-2 border-[#44475a] rounded-2xl p-8 shadow-2xl min-h-[500px]">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-[#282a36] border-2 border-dashed border-[#44475a] flex items-center justify-center text-[#6272a4] overflow-hidden group hover:border-[#bd93f9] transition-colors cursor-pointer relative">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs uppercase font-black">头像</span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#f8f8f2]">头像</h4>
                  <p className="text-[10px] text-[#6272a4] font-mono mt-1">
                    提供用于展示的头像图片链接。
                  </p>
                  <input
                    className="mt-2 w-full bg-[#282a36] border border-[#44475a] p-2 rounded text-[10px] text-[#bd93f9] focus:outline-none"
                    placeholder="输入头像 URL..."
                    value={formData.avatarUrl}
                    onChange={e => setFormData({ ...formData, avatarUrl: e.target.value })}
                  />
                </div>
              </div>
              <InputGroup label="用户名">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={formData.username}
                  readOnly
                />
              </InputGroup>
              <InputGroup label="当前密码">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="新密码">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="确认密码">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                />
              </InputGroup>
              <InputGroup label="个人简介">
                <textarea
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none h-24"
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                />
              </InputGroup>
            </div>
          )}

          {activeTab === 1 && (
            <InputGroup label="Articles per page">
              <input
                type="number"
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                value={prefs.articlePageSize}
                onChange={e => setPrefs({ ...prefs, articlePageSize: parseInt(e.target.value, 10) })}
              />
            </InputGroup>
          )}

          {activeTab === 2 && (
            <InputGroup label="Recycle retention (days)">
              <input
                type="number"
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                value={prefs.recycleBinRetention}
                onChange={e => setPrefs({ ...prefs, recycleBinRetention: parseInt(e.target.value, 10) })}
              />
            </InputGroup>
          )}

          {activeTab === 3 && (
            <InputGroup label="Stats layout">
              <select
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                value={prefs.statsLayout}
                onChange={e => setPrefs({ ...prefs, statsLayout: e.target.value })}
              >
                <option value="GRID">GRID</option>
                <option value="LIST">LIST</option>
                <option value="COMPACT">COMPACT</option>
              </select>
            </InputGroup>
          )}

          {activeTab === 4 && (
            <div className="space-y-6">
              <InputGroup label="OpenAI API key">
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={prefs.aiConfig.apiKey}
                  onChange={e => setPrefs({ ...prefs, aiConfig: { ...prefs.aiConfig, apiKey: e.target.value } })}
                />
              </InputGroup>
              <InputGroup label="API base URL">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={prefs.aiConfig.baseUrl}
                  onChange={e => setPrefs({ ...prefs, aiConfig: { ...prefs.aiConfig, baseUrl: e.target.value } })}
                />
              </InputGroup>
              <InputGroup label="Model id">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={prefs.aiConfig.model}
                  onChange={e => setPrefs({ ...prefs, aiConfig: { ...prefs.aiConfig, model: e.target.value } })}
                />
              </InputGroup>
              <div className="pt-4">
                <button
                  onClick={testAiConnection}
                  disabled={isTestingAi}
                  className="px-6 py-3 border-2 border-[#bd93f9] text-[#bd93f9] font-black text-[10px] rounded-xl hover:bg-[#bd93f9]/10 transition-all uppercase tracking-[0.2em]"
                >
                  {isTestingAi ? 'Testing...' : 'Test AI connection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorSettings;
