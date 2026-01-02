
import React, { useEffect, useRef, useState } from 'react';
import {
  AdminConfig,
  FrontendSiteConfig,
  NavLink,
  SocialLinks,
  SystemConfig,
  ThemeMode,
  UserRole,
  VisualEffectMode,
} from '../types';
import PageHeader from './PageHeader';

interface SystemSettingsProps {
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onUploadFavicon: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

const themeModeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '单主题', value: 'single' },
  { label: '手动选择', value: 'select' },
  { label: '自动明暗', value: 'light-dark-auto' },
];

const statsToolOptions = [
  { label: '内建分析引擎', value: 'INTERNAL' },
  { label: 'Google Analytics 4', value: 'GA4' },
  { label: 'Umami', value: 'UMAMI' },
] as const;

const socialFields: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
  { key: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/...' },
  { key: 'mastodon', label: 'Mastodon', placeholder: 'https://...' },
  { key: 'bluesky', label: 'Bluesky', placeholder: 'https://...' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://...' },
  { key: 'email', label: 'Email', placeholder: 'mailto:...' },
];

const toCharacterDrafts = (characters: Record<string, string>) =>
  Object.entries(characters ?? {}).map(([key, value]) => ({ key, value }));

const normalizeList = (values: string[]) => {
  const trimmed = values.map(item => item.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
};

const formatJson = (value: unknown) => {
  if (!value) return '';
  if (typeof value === 'object' && Object.keys(value as Record<string, unknown>).length === 0) {
    return '';
  }
  return JSON.stringify(value, null, 2);
};

const toNumberOrFallback = (value: string, fallback: number) => {
  const next = Number.parseInt(value, 10);
  return Number.isNaN(next) ? fallback : next;
};

const InputGroup: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({
  label,
  description,
  children,
}) => (
  <div className="space-y-2 mb-6 animate-in slide-in-from-left-4 duration-300">
    <div className="flex justify-between items-baseline">
      <label className="text-sm text-[#6272a4] font-black uppercase tracking-widest ml-1">{label}</label>
      {description && (
        <span className="text-[9px] text-[#6272a4] font-mono italic opacity-60">[{description}]</span>
      )}
    </div>
    {children}
  </div>
);

const MASKED_SECRET = '******';

const SystemSettings: React.FC<SystemSettingsProps> = ({
  config,
  onUpdate,
  onUploadFavicon,
  onTestOssUpload,
}) => {
  const [activeTab, setActiveTab] = useState<string>('admin-core');
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [themeOverridesDraft, setThemeOverridesDraft] = useState('');
  const [characterDrafts, setCharacterDrafts] = useState<Array<{ key: string; value: string }>>([]);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconError, setFaviconError] = useState('');
  const [isTestingOss, setIsTestingOss] = useState(false);
  const [ossTestResult, setOssTestResult] = useState<{ success: boolean; message: string; url?: string } | null>(
    null
  );
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalConfig(config);
    setThemeOverridesDraft(formatJson(config.frontend.themes.overrides));
    setCharacterDrafts(toCharacterDrafts(config.frontend.characters));
  }, [config]);

  const updateAdmin = (patch: Partial<AdminConfig>) =>
    setLocalConfig(prev => ({ ...prev, admin: { ...prev.admin, ...patch } }));

  const updateAdminFont = (patch: Partial<AdminConfig['font']>) =>
    setLocalConfig(prev => ({
      ...prev,
      admin: { ...prev.admin, font: { ...prev.admin.font, ...patch } },
    }));

  const updateFrontend = (patch: Partial<FrontendSiteConfig>) =>
    setLocalConfig(prev => ({ ...prev, frontend: { ...prev.frontend, ...patch } }));

  const updateThemes = (patch: Partial<FrontendSiteConfig['themes']>) =>
    setLocalConfig(prev => ({
      ...prev,
      frontend: { ...prev.frontend, themes: { ...prev.frontend.themes, ...patch } },
    }));

  const updateSocialLinks = (patch: Partial<SocialLinks>) =>
    setLocalConfig(prev => ({
      ...prev,
      frontend: { ...prev.frontend, socialLinks: { ...prev.frontend.socialLinks, ...patch } },
    }));

  const updateOss = (patch: Partial<SystemConfig['oss']>) =>
    setLocalConfig(prev => ({
      ...prev,
      oss: { ...prev.oss, ...patch },
    }));

  const navLinks = localConfig.frontend.navLinks;

  const addNavLink = () => {
    updateFrontend({ navLinks: [...navLinks, { name: '', url: '', external: false }] });
  };

  const removeNavLink = (index: number) => {
    updateFrontend({ navLinks: navLinks.filter((_, idx) => idx !== index) });
  };

  const updateNavLink = (index: number, patch: Partial<NavLink>) => {
    updateFrontend({
      navLinks: navLinks.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    });
  };

  const addCharacter = () => {
    setCharacterDrafts(prev => [...prev, { key: '', value: '' }]);
  };

  const removeCharacter = (index: number) => {
    setCharacterDrafts(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateCharacter = (index: number, patch: Partial<{ key: string; value: string }>) => {
    setCharacterDrafts(prev => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const triggerFaviconInput = () => {
    if (isUploadingFavicon) return;
    if (!faviconInputRef.current) return;
    faviconInputRef.current.value = '';
    faviconInputRef.current.click();
  };

  const handleFaviconChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploadingFavicon(true);
    setFaviconError('');
    try {
      const url = await onUploadFavicon(file);
      updateFrontend({ faviconUrl: url });
    } catch (err) {
      setFaviconError((err as Error).message);
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  const handleTestOssUpload = async () => {
    if (!localConfig.oss.enabled) {
      setOssTestResult({ success: false, message: '请先启用对象存储并保存配置。' });
      return;
    }
    setIsTestingOss(true);
    setOssTestResult(null);
    try {
      const url = await onTestOssUpload();
      setOssTestResult({ success: true, message: '测试上传成功', url });
    } catch (err) {
      setOssTestResult({ success: false, message: (err as Error).message });
    } finally {
      setIsTestingOss(false);
    }
  };

  const handleSave = async () => {
    let overrides: FrontendSiteConfig['themes']['overrides'] | undefined;
    const overridesRaw = themeOverridesDraft.trim();
    if (overridesRaw) {
      try {
        overrides = JSON.parse(overridesRaw);
      } catch (err) {
        alert('主题覆盖配置 JSON 格式错误，请检查。');
        return;
      }
    }

    const tags = normalizeList(localConfig.frontend.tags);
    const themesInclude = normalizeList(localConfig.frontend.themes.include);

    const navLinksClean = localConfig.frontend.navLinks
      .map(link => ({
        name: link.name.trim(),
        url: link.url.trim(),
        external: link.external ? true : undefined,
      }))
      .filter(link => link.name && link.url);

    const socialLinksClean: SocialLinks = {};
    (Object.entries(localConfig.frontend.socialLinks ?? {}) as Array<
      [keyof SocialLinks, string | undefined]
    >).forEach(([key, value]) => {
      const next = String(value ?? '').trim();
      if (next) socialLinksClean[key] = next;
    });

    const charactersClean: Record<string, string> = {};
    characterDrafts.forEach(({ key, value }) => {
      const name = key.trim();
      const path = value.trim();
      if (name && path) charactersClean[name] = path;
    });

    const payload: SystemConfig = {
      admin: {
        ...localConfig.admin,
        adminEmail: localConfig.admin.adminEmail.trim(),
        systemId: localConfig.admin.systemId.trim(),
        siteName: localConfig.admin.siteName.trim(),
        siteDescription: localConfig.admin.siteDescription.trim(),
        statsApiEndpoint: localConfig.admin.statsApiEndpoint.trim(),
        font: {
          face: localConfig.admin.font.face.trim(),
          weight: localConfig.admin.font.weight.trim(),
        },
      },
      frontend: {
        ...localConfig.frontend,
        site: localConfig.frontend.site.trim(),
        title: localConfig.frontend.title.trim(),
        description: localConfig.frontend.description.trim(),
        author: localConfig.frontend.author.trim(),
        tags,
        faviconUrl: localConfig.frontend.faviconUrl.trim(),
        socialCardAvatarImage: localConfig.frontend.socialCardAvatarImage.trim(),
        font: localConfig.frontend.font.trim(),
        navLinks: navLinksClean,
        socialLinks: socialLinksClean,
        themes: {
          ...localConfig.frontend.themes,
          include: themesInclude,
          overrides,
        },
        characters: charactersClean,
      },
      oss: {
        ...localConfig.oss,
        endpoint: localConfig.oss.endpoint?.trim() ?? '',
        bucket: localConfig.oss.bucket?.trim() ?? '',
        accessKey: localConfig.oss.accessKey?.trim() ?? '',
        secretKey:
          localConfig.oss.secretKey?.trim() &&
          localConfig.oss.secretKey?.trim() !== MASKED_SECRET
            ? localConfig.oss.secretKey?.trim()
            : undefined,
        region: localConfig.oss.region?.trim() ?? '',
        customDomain: localConfig.oss.customDomain?.trim() ?? '',
        uploadPath: localConfig.oss.uploadPath?.trim() ?? '',
        imageCompressionQuality:
          typeof localConfig.oss.imageCompressionQuality === 'number'
            ? Math.min(1, Math.max(0.1, localConfig.oss.imageCompressionQuality))
            : 0.8,
      },
    };

    setIsSaving(true);
    try {
      const updated = await onUpdate(payload);
      if (updated) {
        setLocalConfig(updated);
        setThemeOverridesDraft(formatJson(updated.frontend.themes.overrides));
        setCharacterDrafts(toCharacterDrafts(updated.frontend.characters));
        alert('系统配置已更新并同步前台。');
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    {
      group: '后台配置',
      items: [
        { id: 'admin-core', name: '后台基础' },
        { id: 'admin-runtime', name: '后台运行' },
        { id: 'admin-dashboard', name: '控制台体验' },
        { id: 'admin-article', name: '文章与分类' },
        { id: 'admin-stats', name: '数据统计' },
        { id: 'admin-user', name: '用户注册' },
        { id: 'admin-recycle', name: '回收站' },
      ],
    },
    {
      group: '存储配置',
      items: [{ id: 'admin-oss', name: '对象存储' }],
    },
    {
      group: '前台配置',
      items: [
        { id: 'frontend-core', name: '前台基础' },
        { id: 'frontend-nav', name: '导航菜单' },
        { id: 'frontend-social', name: '社交入口' },
        { id: 'frontend-theme', name: '主题样式' },
        { id: 'frontend-interactive', name: '互动组件' },
        { id: 'frontend-characters', name: '角色模块' },
      ],
    },
  ];

  const giscusEnabled = !!localConfig.frontend.giscus;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="系统全局配置" motto="正在同步后台与前台配置，修改后将即时生效。" />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 shrink-0 space-y-4">
          {tabs.map(group => (
            <div key={group.group} className="space-y-2">
              <p className="text-xs text-[#6272a4] font-black uppercase tracking-widest ml-1">
                {group.group}
              </p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-base transition-all duration-300 border ${
                    activeTab === item.id
                      ? 'bg-[#bd93f9] text-[#282a36] border-[#bd93f9] shadow-lg shadow-purple-500/20'
                      : 'text-[#6272a4] border-transparent hover:bg-[#44475a]/30 hover:text-[#f8f8f2]'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ))}
          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-black text-xs rounded-xl shadow-xl transition-all active:scale-95 uppercase tracking-widest border-b-4 border-[#50fa7b]/30 disabled:opacity-60"
            >
              {isSaving ? '同步中...' : '保存并同步'}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#21222c] border-2 border-[#44475a] rounded-2xl p-8 shadow-2xl min-h-[500px]">
          {activeTab === 'admin-core' && (
            <div className="space-y-6">
              <InputGroup label="管理员邮箱" description="后台通知收件">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.admin.adminEmail}
                  onChange={e => updateAdmin({ adminEmail: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="系统唯一标识" description="后台系统 ID">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.admin.systemId}
                  onChange={e => updateAdmin({ systemId: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="后台展示名称" description="后台 UI 标题">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.admin.siteName}
                  onChange={e => updateAdmin({ siteName: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="后台描述文案" description="后台说明">
                <textarea
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none resize-none h-28"
                  value={localConfig.admin.siteDescription}
                  onChange={e => updateAdmin({ siteDescription: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="后台字体" description="全局字体">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      字体族
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                      value={localConfig.admin.font.face}
                      onChange={e => updateAdminFont({ face: e.target.value })}
                      placeholder="ComicShannsMono Nerd Font, Symbols Nerd Font, FangSong"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      字重
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                      value={localConfig.admin.font.weight}
                      onChange={e => updateAdminFont({ weight: e.target.value })}
                      placeholder="normal / 400 / 600"
                    />
                  </div>
                </div>
              </InputGroup>
            </div>
          )}

          {activeTab === 'admin-runtime' && (
            <div className="space-y-6">
              <InputGroup label="全局特效模式" description="后台特效">
                <select
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none appearance-none"
                  value={localConfig.admin.activeEffectMode}
                  onChange={e => updateAdmin({ activeEffectMode: e.target.value as VisualEffectMode })}
                >
                  <option value={VisualEffectMode.SNOW_FALL}>雪花飘落</option>
                  <option value={VisualEffectMode.MATRIX_RAIN}>数字雨</option>
                  <option value={VisualEffectMode.NEON_AMBIENT}>霓虹渐变</option>
                  <option value={VisualEffectMode.TERMINAL_GRID}>终端网格</option>
                  <option value={VisualEffectMode.HEART_PARTICLES}>极客爱心</option>
                  <option value={VisualEffectMode.SCAN_LINES}>CRT 扫描线</option>
                </select>
              </InputGroup>
              <InputGroup label="维护模式" description="站点锁定">
                <button
                  onClick={() => updateAdmin({ maintenanceMode: !localConfig.admin.maintenanceMode })}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
                    localConfig.admin.maintenanceMode
                      ? 'bg-[#ff5545]/10 border-[#ff5545] text-[#ff5545]'
                      : 'bg-[#44475a]/10 border-[#44475a] text-[#6272a4]'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      localConfig.admin.maintenanceMode
                        ? 'bg-[#ff5545] animate-pulse shadow-[0_0_8px_#ff5545]'
                        : 'bg-[#6272a4]'
                    }`}
                  />
                  {localConfig.admin.maintenanceMode ? '维护模式已激活' : '正常运行状态'}
                </button>
              </InputGroup>
            </div>
          )}
          {activeTab === 'admin-dashboard' && (
            <div className="space-y-6">
              <InputGroup label="指标刷新频率 (ms)" description="控制台">
                <input
                  type="number"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.admin.dashboardRefreshRate}
                  onChange={e =>
                    updateAdmin({
                      dashboardRefreshRate: toNumberOrFallback(e.target.value, localConfig.admin.dashboardRefreshRate),
                    })
                  }
                />
              </InputGroup>
              <InputGroup label="快捷草稿组件" description="仪表盘">
                <button
                  onClick={() => updateAdmin({ showQuickDraft: !localConfig.admin.showQuickDraft })}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.admin.showQuickDraft ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.admin.showQuickDraft ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
            </div>
          )}

          {activeTab === 'admin-article' && (
            <div className="space-y-6">
              <InputGroup label="启用 AI 写作助理" description="作者端">
                <button
                  onClick={() => updateAdmin({ enableAiAssistant: !localConfig.admin.enableAiAssistant })}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.admin.enableAiAssistant ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.admin.enableAiAssistant ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
              <InputGroup label="自动保存间隔 (s)" description="编辑器">
                <input
                  type="number"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.admin.autoSaveInterval}
                  onChange={e =>
                    updateAdmin({
                      autoSaveInterval: toNumberOrFallback(e.target.value, localConfig.admin.autoSaveInterval),
                    })
                  }
                />
              </InputGroup>
              <InputGroup label="允许作者自定义分类" description="专栏">
                <button
                  onClick={() =>
                    updateAdmin({ allowAuthorCustomCategories: !localConfig.admin.allowAuthorCustomCategories })
                  }
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.admin.allowAuthorCustomCategories ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.admin.allowAuthorCustomCategories ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
            </div>
          )}

          {activeTab === 'admin-stats' && (
            <div className="space-y-6">
              <InputGroup label="指标接口端点" description="统计网关">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.admin.statsApiEndpoint}
                  onChange={e => updateAdmin({ statsApiEndpoint: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="追踪引擎" description="统计引擎">
                <select
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none appearance-none"
                  value={localConfig.admin.statsTool}
                  onChange={e => updateAdmin({ statsTool: e.target.value as AdminConfig['statsTool'] })}
                >
                  {statsToolOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </InputGroup>
            </div>
          )}

          {activeTab === 'admin-user' && (
            <div className="space-y-6">
              <InputGroup label="开放注册通道" description="注册策略">
                <button
                  onClick={() => updateAdmin({ allowRegistration: !localConfig.admin.allowRegistration })}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.admin.allowRegistration ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.admin.allowRegistration ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
              <InputGroup label="默认分配角色" description="注册默认">
                <select
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none appearance-none"
                  value={localConfig.admin.defaultUserRole}
                  onChange={e => updateAdmin({ defaultUserRole: e.target.value as UserRole })}
                >
                  <option value={UserRole.AUTHOR}>作者节点</option>
                  <option value={UserRole.ADMIN}>管理员</option>
                </select>
              </InputGroup>
            </div>
          )}

          {activeTab === 'admin-recycle' && (
            <InputGroup label="回收站保留天数" description="清理策略">
              <input
                type="number"
                className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                value={localConfig.admin.recycleBinRetentionDays}
                onChange={e =>
                  updateAdmin({
                    recycleBinRetentionDays: toNumberOrFallback(
                      e.target.value,
                      localConfig.admin.recycleBinRetentionDays
                    ),
                  })
                }
              />
            </InputGroup>
          )}

          {activeTab === 'admin-oss' && (
            <div className="space-y-6">
              <InputGroup label="测试上传" description="保存配置后执行">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleTestOssUpload}
                    disabled={isTestingOss}
                    className="px-4 py-2 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-black text-[10px] rounded-lg uppercase tracking-widest disabled:opacity-60 self-start"
                  >
                    {isTestingOss ? '测试中...' : '测试上传'}
                  </button>
                  {ossTestResult && (
                    <div
                      className={`text-xs font-mono ${
                        ossTestResult.success ? 'text-[#50fa7b]' : 'text-[#ff5545]'
                      }`}
                    >
                      {ossTestResult.message}
                      {ossTestResult.url ? `：${ossTestResult.url}` : ''}
                    </div>
                  )}
                </div>
              </InputGroup>
              <InputGroup label="启用对象存储" description="必填 / 开关">
                <button
                  onClick={() => updateOss({ enabled: !localConfig.oss.enabled })}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.oss.enabled ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.oss.enabled ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
              <InputGroup label="存储服务商" description="必填">
                <select
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none appearance-none"
                  value={localConfig.oss.provider}
                  onChange={e => updateOss({ provider: e.target.value as SystemConfig['oss']['provider'] })}
                >
                  <option value="oss">Aliyun OSS</option>
                  <option value="minio">MinIO</option>
                </select>
              </InputGroup>
              <InputGroup label="Endpoint" description="必填">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.endpoint ?? ''}
                  onChange={e => updateOss({ endpoint: e.target.value })}
                  placeholder="https://oss-cn-shanghai.aliyuncs.com"
                />
              </InputGroup>
              <InputGroup label="Bucket" description="必填">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.bucket ?? ''}
                  onChange={e => updateOss({ bucket: e.target.value })}
                  placeholder="my-blog-bucket"
                />
              </InputGroup>
              <InputGroup label="Region" description="选填 / OSS 或 MinIO">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.region ?? ''}
                  onChange={e => updateOss({ region: e.target.value })}
                  placeholder="us-east-1"
                />
              </InputGroup>
              <InputGroup label="自定义域名" description="选填">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.customDomain ?? ''}
                  onChange={e => updateOss({ customDomain: e.target.value })}
                  placeholder="https://cdn.example.com"
                />
              </InputGroup>
              <InputGroup label="上传路径前缀" description="选填">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.uploadPath ?? ''}
                  onChange={e => updateOss({ uploadPath: e.target.value })}
                  placeholder="blog-assets/"
                />
              </InputGroup>
              <InputGroup label="图片压缩程度" description="0.1 - 1.0">
                <div className="flex flex-col gap-3">
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={localConfig.oss.imageCompressionQuality ?? 0.8}
                    onChange={e => updateOss({ imageCompressionQuality: Number(e.target.value) })}
                    className="range-thick"
                  />
                  <div className="flex items-center justify-between text-xs font-mono text-[#6272a4]">
                    <span>低压缩</span>
                    <span className="text-[#f8f8f2]">
                      {(localConfig.oss.imageCompressionQuality ?? 0.8).toFixed(2)}
                    </span>
                    <span>高质量</span>
                  </div>
                </div>
              </InputGroup>
              <InputGroup label="Access Key" description="必填">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.accessKey ?? ''}
                  onChange={e => updateOss({ accessKey: e.target.value })}
                  autoComplete="new-password"
                />
              </InputGroup>
              <InputGroup label="Secret Key" description="必填">
                <input
                  type="password"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.oss.secretKey ?? ''}
                  onChange={e => updateOss({ secretKey: e.target.value })}
                  autoComplete="new-password"
                />
              </InputGroup>
            </div>
          )}
          {activeTab === 'frontend-core' && (
            <div className="space-y-6">
              <InputGroup label="站点地址" description="前台根域">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.frontend.site}
                  onChange={e => updateFrontend({ site: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="站点标题" description="前台标题">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.frontend.title}
                  onChange={e => updateFrontend({ title: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="站点描述" description="SEO 说明">
                <textarea
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none resize-none h-28"
                  value={localConfig.frontend.description}
                  onChange={e => updateFrontend({ description: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="站点作者" description="署名">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.frontend.author}
                  onChange={e => updateFrontend({ author: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="前台标签" description="逗号分隔">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.frontend.tags.join(', ')}
                  onChange={e =>
                    updateFrontend({
                      tags: e.target.value.split(/[,，\n]/).map(tag => tag.trim()).filter(Boolean),
                    })
                  }
                />
              </InputGroup>
              <InputGroup label="每页文章数" description="分页">
                <input
                  type="number"
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.frontend.pageSize}
                  onChange={e =>
                    updateFrontend({
                      pageSize: toNumberOrFallback(e.target.value, localConfig.frontend.pageSize),
                    })
                  }
                />
              </InputGroup>
              <InputGroup label="URL 尾斜杠" description="路径规则">
                <button
                  onClick={() => updateFrontend({ trailingSlashes: !localConfig.frontend.trailingSlashes })}
                  className={`w-14 h-7 rounded-full relative transition-all ${
                    localConfig.frontend.trailingSlashes ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                      localConfig.frontend.trailingSlashes ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </InputGroup>
              <InputGroup label="前台字体" description="全站字体">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                  value={localConfig.frontend.font}
                  onChange={e => updateFrontend({ font: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="社交卡头像" description="图片路径">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.frontend.socialCardAvatarImage}
                  onChange={e => updateFrontend({ socialCardAvatarImage: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="站点 Favicon" description="上传或 URL">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg border border-[#44475a] bg-[#282a36] flex items-center justify-center overflow-hidden">
                      {localConfig.frontend.faviconUrl ? (
                        <img
                          src={localConfig.frontend.faviconUrl}
                          alt="favicon"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-[#6272a4] font-mono">N/A</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={triggerFaviconInput}
                      disabled={isUploadingFavicon}
                      className="px-4 py-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-[10px] rounded-lg uppercase tracking-widest disabled:opacity-60"
                    >
                      {isUploadingFavicon ? '上传中...' : '上传 favicon'}
                    </button>
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.jpg,.jpeg,.webp,.gif"
                      ref={faviconInputRef}
                      onChange={handleFaviconChange}
                      className="hidden"
                    />
                  </div>
                  <input
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                    value={localConfig.frontend.faviconUrl}
                    onChange={e => updateFrontend({ faviconUrl: e.target.value })}
                    placeholder="https://cdn.example.com/favicon.svg"
                  />
                  {faviconError && (
                    <div className="text-xs text-[#ff5545] font-mono">{faviconError}</div>
                  )}
                </div>
              </InputGroup>
            </div>
          )}

          {activeTab === 'frontend-nav' && (
            <div className="space-y-6">
              {navLinks.length === 0 ? (
                <div className="text-[10px] text-[#6272a4] font-mono uppercase italic">暂无导航配置。</div>
              ) : (
                navLinks.map((link, index) => (
                  <div
                    key={`${link.name}-${index}`}
                    className="bg-[#282a36] border border-[#44475a] rounded-xl p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                          名称
                        </label>
                        <input
                          className="w-full bg-[#21222c] border border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                          value={link.name}
                          onChange={e => updateNavLink(index, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                          地址
                        </label>
                        <input
                          className="w-full bg-[#21222c] border border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                          value={link.url}
                          onChange={e => updateNavLink(index, { url: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">
                        外链跳转
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!link.external}
                          onChange={e => updateNavLink(index, { external: e.target.checked })}
                          className="w-4 h-4 accent-[#bd93f9]"
                        />
                        <button
                          onClick={() => removeNavLink(index)}
                          className="text-[10px] font-black text-[#ff5545] uppercase"
                        >
                          移除
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={addNavLink}
                className="px-5 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest"
              >
                新增导航
              </button>
            </div>
          )}
          {activeTab === 'frontend-social' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {socialFields.map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                    {field.label}
                  </label>
                  <input
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                    placeholder={field.placeholder}
                    value={localConfig.frontend.socialLinks[field.key] ?? ''}
                    onChange={e => updateSocialLinks({ [field.key]: e.target.value } as Partial<SocialLinks>)}
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'frontend-theme' && (
            <div className="space-y-6">
              <InputGroup label="主题模式" description="样式选择">
                <select
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none appearance-none"
                  value={localConfig.frontend.themes.mode}
                  onChange={e => updateThemes({ mode: e.target.value as ThemeMode })}
                >
                  {themeModeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </InputGroup>
              <InputGroup label="默认主题" description="主题 ID">
                <input
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                  value={localConfig.frontend.themes.default}
                  onChange={e => updateThemes({ default: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="主题包列表" description="一行一个">
                <textarea
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none resize-none h-40 font-mono"
                  value={localConfig.frontend.themes.include.join('\n')}
                  onChange={e =>
                    updateThemes({
                      include: e.target.value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean),
                    })
                  }
                />
              </InputGroup>
              <InputGroup label="主题覆盖" description="JSON 可选">
                <textarea
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 rounded-xl text-sm focus:border-[#bd93f9] outline-none resize-none h-40 font-mono"
                  value={themeOverridesDraft}
                  onChange={e => setThemeOverridesDraft(e.target.value)}
                  placeholder='{"theme-name": {"background": "#000000"}}'
                />
              </InputGroup>
            </div>
          )}
          {activeTab === 'frontend-interactive' && (
            <div className="space-y-6">
              <InputGroup label="启用 Giscus" description="评论系统">
                <button
                  onClick={() =>
                    updateFrontend({
                      giscus: giscusEnabled
                        ? undefined
                        : {
                            repo: '',
                            repoId: '',
                            category: '',
                            categoryId: '',
                            reactionsEnabled: true,
                          },
                    })
                  }
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${
                    giscusEnabled
                      ? 'bg-[#50fa7b]/10 border-[#50fa7b] text-[#50fa7b]'
                      : 'bg-[#44475a]/10 border-[#44475a] text-[#6272a4]'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      giscusEnabled
                        ? 'bg-[#50fa7b] animate-pulse shadow-[0_0_8px_#50fa7b]'
                        : 'bg-[#6272a4]'
                    }`}
                  />
                  {giscusEnabled ? '已启用评论' : '暂未启用'}
                </button>
              </InputGroup>
              {giscusEnabled && localConfig.frontend.giscus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      Repo
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                      value={localConfig.frontend.giscus.repo}
                      onChange={e =>
                        updateFrontend({
                          giscus: { ...localConfig.frontend.giscus!, repo: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      Repo ID
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                      value={localConfig.frontend.giscus.repoId}
                      onChange={e =>
                        updateFrontend({
                          giscus: { ...localConfig.frontend.giscus!, repoId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      分类
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none"
                      value={localConfig.frontend.giscus.category}
                      onChange={e =>
                        updateFrontend({
                          giscus: { ...localConfig.frontend.giscus!, category: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      分类 ID
                    </label>
                    <input
                      className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                      value={localConfig.frontend.giscus.categoryId}
                      onChange={e =>
                        updateFrontend({
                          giscus: { ...localConfig.frontend.giscus!, categoryId: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                      启用反应
                    </label>
                    <button
                      onClick={() =>
                        updateFrontend({
                          giscus: {
                            ...localConfig.frontend.giscus!,
                            reactionsEnabled: !localConfig.frontend.giscus!.reactionsEnabled,
                          },
                        })
                      }
                      className={`w-14 h-7 rounded-full relative transition-all ${
                        localConfig.frontend.giscus.reactionsEnabled ? 'bg-[#50fa7b]' : 'bg-[#44475a]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-[#282a36] transition-all ${
                          localConfig.frontend.giscus.reactionsEnabled ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'frontend-characters' && (
            <div className="space-y-6">
              {characterDrafts.length === 0 ? (
                <div className="text-[10px] text-[#6272a4] font-mono uppercase italic">暂无角色资源。</div>
              ) : (
                characterDrafts.map((item, index) => (
                  <div
                    key={`${item.key}-${index}`}
                    className="bg-[#282a36] border border-[#44475a] rounded-xl p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                          标识
                        </label>
                        <input
                          className="w-full bg-[#21222c] border border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                          value={item.key}
                          onChange={e => updateCharacter(index, { key: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest ml-1">
                          图片路径
                        </label>
                        <input
                          className="w-full bg-[#21222c] border border-[#44475a] p-3 rounded-xl text-sm focus:border-[#bd93f9] outline-none font-mono"
                          value={item.value}
                          onChange={e => updateCharacter(index, { value: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => removeCharacter(index)}
                      className="text-[10px] font-black text-[#ff5545] uppercase"
                    >
                      移除角色
                    </button>
                  </div>
                ))
              )}
              <button
                onClick={addCharacter}
                className="px-5 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest"
              >
                新增角色
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
