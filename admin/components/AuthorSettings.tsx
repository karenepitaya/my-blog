import React, { useEffect, useRef, useState } from 'react';
import { User } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';

interface AuthorSettingsProps {
  user: User;
  onUpdateProfile: (input: { avatarUrl?: string | null; bio?: string | null }) => Promise<void>;
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  onUpdateAiConfig: (input: { apiKey?: string | null; baseUrl?: string | null; model?: string | null }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
}

const DEFAULT_AI_CONFIG = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
};

type DialogType = 'avatar' | 'bio' | 'password' | 'username' | null;

const AuthorSettings: React.FC<AuthorSettingsProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  onUpdateAiConfig,
  onUploadAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'ai'>('account');
  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [avatarDraft, setAvatarDraft] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [passwordDraft, setPasswordDraft] = useState({ current: '', next: '', confirm: '' });
  const [aiConfig, setAiConfig] = useState({
    ...DEFAULT_AI_CONFIG,
    ...(user.preferences?.aiConfig ?? {}),
  });
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatarDraft(user.avatarUrl ?? '');
    setAvatarPreview(user.avatarUrl ?? '');
    setBioDraft(user.bio ?? '');
    setAiConfig({
      ...DEFAULT_AI_CONFIG,
      ...(user.preferences?.aiConfig ?? {}),
    });
  }, [
    user.id,
    user.avatarUrl,
    user.bio,
    user.preferences?.aiConfig?.apiKey,
    user.preferences?.aiConfig?.baseUrl,
    user.preferences?.aiConfig?.model,
  ]);

  useEffect(() => {
    if (activeDialog === 'avatar') {
      setAvatarPreview(avatarDraft.trim());
    }
  }, [activeDialog, avatarDraft]);

  const openDialog = (dialog: DialogType) => {
    if (dialog === 'avatar') {
      setAvatarDraft(user.avatarUrl ?? '');
      setAvatarPreview(user.avatarUrl ?? '');
    }
    if (dialog === 'bio') {
      setBioDraft(user.bio ?? '');
    }
    if (dialog === 'password') {
      setPasswordDraft({ current: '', next: '', confirm: '' });
    }
    setActiveDialog(dialog);
  };

  const closeDialog = () => setActiveDialog(null);

  const appendAiLog = (line: string) => {
    const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setAiLogs(prev => [...prev.slice(-49), `[${timestamp}] ${line}`]);
  };

  const maskKey = (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return '';
    if (trimmed.length <= 6) return `${trimmed.slice(0, 2)}***`;
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
  };

  const requestModels = async (withLogs: boolean) => {
    const baseUrl = aiConfig.baseUrl.trim().replace(/\/$/, '');
    if (!baseUrl) throw new Error('BASE_URL_REQUIRED');

    const url = `${baseUrl}/models`;
    const headers: Record<string, string> = { Accept: 'application/json' };
    const apiKey = aiConfig.apiKey.trim();
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    if (withLogs) {
      appendAiLog(`> GET ${url}`);
      if (apiKey) appendAiLog(`> Authorization: Bearer ${maskKey(apiKey)}`);
    }

    const response = await fetch(url, { headers });
    let payload: any = null;
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }

    if (withLogs) {
      appendAiLog(`< ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const message = payload?.error?.message ?? payload?.message ?? `HTTP ${response.status}`;
      if (withLogs) appendAiLog(`< error: ${message}`);
      throw new Error(message);
    }

    const items = payload?.data ?? payload?.models ?? payload?.items ?? [];
    const options = Array.isArray(items)
      ? items
          .map((item: any) => String(item?.id ?? item?.name ?? item?.model ?? '').trim())
          .filter(Boolean)
      : [];
    if (withLogs) appendAiLog(`< models: ${options.length}`);
    return options;
  };

  const refreshModels = async () => {
    setIsRefreshingModels(true);
    try {
      const options = await requestModels(false);
      setModelOptions(options);
      if (options.length > 0 && !options.includes(aiConfig.model)) {
        setAiConfig(prev => ({ ...prev, model: options[0] }));
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  const testAiConnection = async () => {
    setIsTestingAi(true);
    try {
      await requestModels(true);
    } catch (err) {
      // Errors are logged in the terminal panel.
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSaveAi = async () => {
    const payload = {
      apiKey: aiConfig.apiKey.trim() ? aiConfig.apiKey.trim() : null,
      baseUrl: aiConfig.baseUrl.trim() ? aiConfig.baseUrl.trim() : null,
      model: aiConfig.model.trim() ? aiConfig.model.trim() : null,
    };
    setIsSavingAi(true);
    try {
      await onUpdateAiConfig(payload);
      alert('AI 配置已保存。');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const url = await onUploadAvatar(file);
      setAvatarDraft(url);
      setAvatarPreview(url);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const AccountRow: React.FC<{
    label: string;
    value: React.ReactNode;
    hint?: string;
    onEdit?: () => void;
  }> = ({ label, value, hint, onEdit }) => (
    <div className="flex items-center justify-between gap-4 bg-[#1f202a] border border-[#3f4152] rounded-2xl px-5 py-4">
      <div className="space-y-1">
        <p className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">{label}</p>
        <div className="text-sm text-[#f8f8f2] font-mono">{value}</div>
        {hint && <p className="text-[10px] text-[#6272a4]">{hint}</p>}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="w-9 h-9 rounded-xl border border-[#44475a] text-[#8be9fd] hover:text-[#f8f8f2] hover:border-[#8be9fd] transition-colors"
          title="修改"
        >
          <Icons.Edit />
        </button>
      )}
    </div>
  );

  const ModalShell: React.FC<{ title: string; children: React.ReactNode; actions: React.ReactNode }> = ({
    title,
    children,
    actions,
  }) => (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-[#0f1117]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#44475a]">
          <h3 className="text-sm font-black text-[#f8f8f2] uppercase tracking-widest">{title}</h3>
          <button
            type="button"
            onClick={closeDialog}
            className="text-[10px] font-black text-[#6272a4] uppercase tracking-widest hover:text-[#f8f8f2]"
          >
            关闭
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-[#44475a]">{actions}</div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="个人资料" motto="作者档案与 AI 能力配置。" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {[
            { id: 'account', name: '账户' },
            { id: 'ai', name: 'AI 配置' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'account' | 'ai')}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 border ${
                activeTab === tab.id
                  ? 'bg-[#bd93f9] text-[#282a36] border-[#bd93f9] shadow-lg shadow-purple-500/20'
                  : 'text-[#6272a4] border-transparent hover:bg-[#44475a]/30 hover:text-[#f8f8f2]'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-[#21222c] border-2 border-[#44475a] rounded-2xl p-8 shadow-2xl min-h-[500px]">
          {activeTab === 'account' && (
            <div className="space-y-5">
              <AccountRow
                label="头像"
                value={
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#282a36] border border-[#44475a] overflow-hidden flex items-center justify-center">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="头像" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-[#6272a4] font-black">无</span>
                      )}
                    </div>
                    <span className="text-xs text-[#6272a4]">上传或粘贴图片</span>
                  </div>
                }
                onEdit={() => openDialog('avatar')}
              />
              <AccountRow
                label="用户名"
                value={<span className="text-[#f8f8f2]">{user.username}</span>}
                onEdit={() => openDialog('username')}
              />
              <AccountRow
                label="个人简介"
                value={<span className="text-[#f8f8f2]/80">{user.bio || '未填写'}</span>}
                onEdit={() => openDialog('bio')}
              />
              <AccountRow
                label="密码"
                value={<span className="text-[#f8f8f2]/70">••••••••</span>}
                onEdit={() => openDialog('password')}
              />
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
              <div className="space-y-6">
                <div className="bg-[#1f202a] border border-[#44475a] rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-[#f8f8f2] uppercase tracking-[0.2em]">AI 接入</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={refreshModels}
                        disabled={isRefreshingModels}
                        className="px-3 py-2 rounded-lg border border-[#8be9fd]/40 text-[#8be9fd] text-[10px] font-black uppercase tracking-widest hover:bg-[#8be9fd]/10 disabled:opacity-60"
                      >
                        {isRefreshingModels ? '同步中' : '刷新模型'}
                      </button>
                      <button
                        type="button"
                        onClick={testAiConnection}
                        disabled={isTestingAi}
                        className="px-3 py-2 rounded-lg border border-[#bd93f9]/40 text-[#bd93f9] text-[10px] font-black uppercase tracking-widest hover:bg-[#bd93f9]/10 disabled:opacity-60"
                      >
                        {isTestingAi ? '测试中' : '联通测试'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">API 密钥</label>
                    <input
                      type="password"
                      value={aiConfig.apiKey}
                      onChange={e => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">API 地址</label>
                    <input
                      value={aiConfig.baseUrl}
                      onChange={e => setAiConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">模型 ID</label>
                    <input
                      value={aiConfig.model}
                      onChange={e => setAiConfig(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="gpt-4o-mini"
                    />
                    {modelOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {modelOptions.slice(0, 8).map(model => (
                          <button
                            key={model}
                            type="button"
                            onClick={() => setAiConfig(prev => ({ ...prev, model }))}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                              aiConfig.model === model
                                ? 'border-[#50fa7b]/60 text-[#50fa7b] bg-[#50fa7b]/10'
                                : 'border-[#44475a] text-[#6272a4] hover:text-[#f8f8f2] hover:border-[#bd93f9]'
                            }`}
                          >
                            {model}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-[#44475a] flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveAi}
                      disabled={isSavingAi}
                      className="px-6 py-3 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-black text-[10px] rounded-xl uppercase tracking-[0.2em] disabled:opacity-60"
                    >
                      {isSavingAi ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#11131a] border border-[#2b2f3a] rounded-2xl p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black text-[#50fa7b] uppercase tracking-[0.3em]">连接日志</h3>
                  <button
                    type="button"
                    onClick={() => setAiLogs([])}
                    className="text-[10px] font-black text-[#6272a4] uppercase tracking-widest hover:text-[#f8f8f2]"
                  >
                    清空
                  </button>
                </div>
                <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto custom-scrollbar font-terminal text-[10px] text-[#8be9fd] space-y-2">
                  {aiLogs.length === 0 ? (
                    <p className="text-[#6272a4]">暂无联通日志。</p>
                  ) : (
                    aiLogs.map((line, index) => (
                      <p key={`${line}-${index}`} className="leading-relaxed">
                        {line}
                      </p>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeDialog === 'avatar' && (
        <ModalShell
          title="更新头像"
          actions={
            <>
              <button
                type="button"
                onClick={closeDialog}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onUpdateProfile({
                      avatarUrl: avatarDraft.trim() ? avatarDraft.trim() : null,
                    });
                    closeDialog();
                  } catch (err) {
                    alert((err as Error).message);
                  }
                }}
                className="flex-1 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl transition-all uppercase tracking-widest"
              >
                保存
              </button>
            </>
          }
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl border border-[#44475a] bg-[#282a36] overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="头像预览" className="w-full h-full object-cover" />
              ) : (
                        <span className="text-[10px] text-[#6272a4] font-black">无</span>
              )}
            </div>
            <div className="space-y-2 flex-1">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-4 py-2 rounded-lg border border-[#8be9fd]/40 text-[#8be9fd] text-[10px] font-black uppercase tracking-widest hover:bg-[#8be9fd]/10 disabled:opacity-60"
              >
                {isUploadingAvatar ? '上传中...' : '上传本地图片'}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={avatarInputRef}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) void handleAvatarFile(file);
                  e.currentTarget.value = '';
                }}
                className="hidden"
              />
              <input
                value={avatarDraft}
                onChange={e => setAvatarDraft(e.target.value)}
                placeholder="粘贴头像 URL"
              />
            </div>
          </div>
        </ModalShell>
      )}

      {activeDialog === 'bio' && (
        <ModalShell
          title="更新简介"
          actions={
            <>
              <button
                type="button"
                onClick={closeDialog}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onUpdateProfile({
                      bio: bioDraft.trim() ? bioDraft.trim() : null,
                    });
                    closeDialog();
                  } catch (err) {
                    alert((err as Error).message);
                  }
                }}
                className="flex-1 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl transition-all uppercase tracking-widest"
              >
                保存
              </button>
            </>
          }
        >
          <textarea
            value={bioDraft}
            onChange={e => setBioDraft(e.target.value)}
            placeholder="一句话介绍自己"
            className="w-full h-32 bg-[#282a36] border border-[#44475a] p-4 rounded-xl text-sm text-[#f8f8f2]/90 focus:border-[#bd93f9] outline-none resize-none"
          />
        </ModalShell>
      )}

      {activeDialog === 'password' && (
        <ModalShell
          title="修改密码"
          actions={
            <>
              <button
                type="button"
                onClick={closeDialog}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  const next = passwordDraft.next.trim();
                  const confirm = passwordDraft.confirm.trim();
                  const current = passwordDraft.current.trim();
                  if (!current || !next || !confirm) {
                    alert('请完整填写密码信息。');
                    return;
                  }
                  if (next !== confirm) {
                    alert('两次输入的新密码不一致。');
                    return;
                  }
                  try {
                    await onChangePassword({ currentPassword: current, newPassword: next });
                    closeDialog();
                  } catch (err) {
                    alert((err as Error).message);
                  }
                }}
                className="flex-1 py-3 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-black text-xs rounded-xl transition-all uppercase tracking-widest"
              >
                确认修改
              </button>
            </>
          }
        >
          <p className="text-[10px] text-[#6272a4]">密码最少 6 位，修改后立即生效。</p>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordDraft.current}
              onChange={e => setPasswordDraft(prev => ({ ...prev, current: e.target.value }))}
              placeholder="当前密码"
            />
            <input
              type="password"
              value={passwordDraft.next}
              onChange={e => setPasswordDraft(prev => ({ ...prev, next: e.target.value }))}
              placeholder="新密码"
            />
            <input
              type="password"
              value={passwordDraft.confirm}
              onChange={e => setPasswordDraft(prev => ({ ...prev, confirm: e.target.value }))}
              placeholder="确认新密码"
            />
          </div>
        </ModalShell>
      )}

      {activeDialog === 'username' && (
        <ModalShell
          title="用户名"
          actions={
            <button
              type="button"
              onClick={closeDialog}
              className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
            >
              关闭
            </button>
          }
        >
          <input value={user.username} readOnly />
          <p className="text-[10px] text-[#6272a4]">暂不支持修改用户名。</p>
        </ModalShell>
      )}
    </div>
  );
};

export default AuthorSettings;
