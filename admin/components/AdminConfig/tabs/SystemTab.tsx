import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { CyberInput } from '../ui/CyberInput';
import { ConfirmModal } from '../ui/ConfirmModal';
import { AdminSystemConfig, FrontendSiteConfig, NavLinkConfig, SocialLinkConfig, CharacterConfig } from '../types';
import { 
    Save, RefreshCw, Settings2, Globe, Palette, Layout, Link as LinkIcon, 
    Users, UserCircle, FileText, Zap, Shield, Trash2, Plus, 
    Monitor, Server, PenTool, Power, Lock, Unlock, Upload, AlertTriangle, Camera
} from 'lucide-react';

// --- Mocks ---
const DEFAULT_NAV: NavLinkConfig[] = [
    { id: '1', label: '首页', path: '/', enableExternal: false, visible: true },
    { id: '2', label: '关于', path: '/about', enableExternal: false, visible: true },
    { id: '3', label: '归档', path: '/archive', enableExternal: false, visible: true },
    { id: '4', label: 'GitHub', path: 'https://github.com/yourname', enableExternal: true, visible: true },
];

const DEFAULT_SOCIAL: SocialLinkConfig[] = [
    { id: '1', platform: 'Github', url: 'https://github.com', visible: true },
    { id: '2', platform: 'Twitter', url: 'https://twitter.com', visible: true },
];

const DEFAULT_CHARACTERS: CharacterConfig[] = [
    { id: '1', name: 'Owl Bot', avatar: '', enable: true },
    { id: '2', name: 'Karene', avatar: '', enable: true },
];

const MOCK_THEMES = [
    { value: 'catppuccin-latte', label: 'Catppuccin Latte (Light)' },
    { value: 'catppuccin-mocha', label: 'Catppuccin Mocha (Dark)' },
    { value: 'dracula', label: 'Dracula (Dark)' },
    { value: 'github-dark', label: 'GitHub Dark' },
    { value: 'one-dark', label: 'One Dark Pro' },
    { value: 'nord', label: 'Nord' },
    { value: 'solarized-light', label: 'Solarized Light' },
];

const MOCK_FRONTEND: FrontendSiteConfig = {
    siteName: "Karene's Blog",
    siteTitle: "Karene | Digital Garden",
    siteDescription: "A cyberpunk themed blog powered by MultiTerm.",
    siteKeywords: "React, Astro, Cyberpunk, Tech",
    faviconUrl: "",
    themeMode: 'day-night',
    themeDefault: 'catppuccin-latte',
    themeDark: 'catppuccin-mocha',
    enableSeasonEffect: true,
    seasonEffectType: 'snow',
    enableGiscus: false,
    giscusRepo: '',
    giscusCategory: '',
    enableCharacters: true,
    activeCharacters: DEFAULT_CHARACTERS,
    enableAuthorCard: true,
    authorCardStyle: 'detailed',
    pageSize: 6,
    enableRecommendations: true,
    recommendationMode: 'tag',
    navLinks: DEFAULT_NAV,
    socialLinks: DEFAULT_SOCIAL,
    siteMode: 'normal'
};

const MOCK_ADMIN: AdminSystemConfig = {
    enableEnhancedSeo: false,
    adminTitle: "MultiTerm Admin",
    adminFavicon: "/admin-favicon.png",
    enableBgEffect: true,
    activeEffectMode: 'SNOW_FALL',
    effectIntensity: 0.8,
    recycleBinRetentionDays: 15,
    autoSaveInterval: 30,
    previewLoadCover: false,
    enableImgCompression: true,
    maintenanceMode: false
};

// --- Helper Components ---
const Toggle = ({ checked, onChange, label, subLabel, color = 'text-slate-200', disabled }: any) => (
    <div 
        onClick={() => !disabled && onChange(!checked)}
        className={`
            flex items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl transition-all group
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.05]'}
        `}
    >
        <div className="flex-1 min-w-0">
            <span className={`text-sm font-bold ${color} group-hover:text-white transition-colors block truncate`}>{label}</span>
            {subLabel && <span className="text-xs text-slate-500 mt-1 block truncate">{subLabel}</span>}
        </div>
        <div className={`shrink-0 w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-white/10'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    </div>
);

const SectionTitle = ({ icon: Icon, title, badge }: any) => (
    <div className="flex items-center gap-3 mb-6 text-[#6272a4] border-b border-white/5 pb-4">
        <div className="p-1.5 rounded-lg bg-white/5 text-secondary">
             <Icon size={18} />
        </div>
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-300">{title}</h3>
        {badge && <span className="ml-auto text-[10px] px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">{badge}</span>}
    </div>
);

export type SystemTabProps = {
    initialFrontend: FrontendSiteConfig;
    initialBackend: AdminSystemConfig;
    onCommit: (next: { frontend: FrontendSiteConfig; backend: AdminSystemConfig }) => Promise<void>;
    onUploadFavicon: (file: File) => Promise<string>;
};

export const SystemTab: React.FC<SystemTabProps> = ({ initialFrontend, initialBackend, onCommit, onUploadFavicon }) => {
    const [frontend, setFrontend] = useState(initialFrontend);
    const [backend, setBackend] = useState(initialBackend);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Modal States
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showMaintConfirm, setShowMaintConfirm] = useState(false);
    const [pendingMaintState, setPendingMaintState] = useState(false);

    // Refs
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const charInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

    useEffect(() => {
        if (isEditing) return;
        setFrontend(initialFrontend);
        setBackend(initialBackend);
    }, [initialBackend, initialFrontend, isEditing]);

    const triggerSave = async () => {
        setIsSaving(true);
        setShowSaveConfirm(false);
        try {
            await onCommit({ frontend, backend });
            setIsEditing(false); // Auto lock after save
        } catch (err) {
            alert((err as Error).message || '保存失败');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleMaintenance = () => {
        setBackend({...backend, maintenanceMode: pendingMaintState});
        setShowMaintConfirm(false);
    };

    // --- File Handlers ---
    const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFrontend({ ...frontend, faviconUrl: reader.result as string });
            };
            reader.readAsDataURL(file);

            onUploadFavicon(file)
                .then((url) => setFrontend((prev) => ({ ...prev, faviconUrl: url })))
                .catch((err) => console.warn('Favicon upload failed.', err));
        }
    };

    const handleCharAvatarUpload = (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFrontend({
                    ...frontend,
                    activeCharacters: frontend.activeCharacters.map(c => 
                        c.id === charId ? { ...c, avatar: reader.result as string } : c
                    )
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Character Handlers ---
    const addCharacter = () => {
        const newChar: CharacterConfig = { 
            id: Date.now().toString(), 
            name: 'New Role', 
            avatar: '', 
            enable: true 
        };
        setFrontend({...frontend, activeCharacters: [...frontend.activeCharacters, newChar]});
    };

    const removeCharacter = (id: string) => {
        setFrontend({...frontend, activeCharacters: frontend.activeCharacters.filter(c => c.id !== id)});
    };

    const updateCharacter = (id: string, field: keyof CharacterConfig, value: any) => {
        setFrontend({
            ...frontend,
            activeCharacters: frontend.activeCharacters.map(c => 
                c.id === id ? { ...c, [field]: value } : c
            )
        });
    };

    // --- Nav Handlers ---
    const handleAddNav = () => {
        const newNav: NavLinkConfig = { id: Date.now().toString(), label: '新链接', path: '/', enableExternal: false, visible: true };
        setFrontend({...frontend, navLinks: [...frontend.navLinks, newNav]});
    };
    const updateNav = (id: string, field: keyof NavLinkConfig, value: any) => {
        setFrontend({
            ...frontend,
            navLinks: frontend.navLinks.map(n => n.id === id ? { ...n, [field]: value } : n)
        });
    };
    const removeNav = (id: string) => {
        setFrontend({...frontend, navLinks: frontend.navLinks.filter(n => n.id !== id)});
    };

    const handleAddSocial = () => {
        const newSocial: SocialLinkConfig = { id: Date.now().toString(), platform: 'Platform', url: 'https://', visible: true };
        setFrontend({...frontend, socialLinks: [...frontend.socialLinks, newSocial]});
    };
    const updateSocial = (id: string, field: keyof SocialLinkConfig, value: any) => {
        setFrontend({
            ...frontend,
            socialLinks: frontend.socialLinks.map(s => s.id === id ? { ...s, [field]: value } : s)
        });
    };
    const removeSocial = (id: string) => {
        setFrontend({...frontend, socialLinks: frontend.socialLinks.filter(s => s.id !== id)});
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-[#44475a]/20 p-4 rounded-2xl border border-white/5 backdrop-blur-md sticky top-2 z-20 shadow-xl mx-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Settings2 size={20} /></div>
                    <h3 className="text-lg font-bold text-slate-200">应用全域配置</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors
                        ${isEditing ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-slate-500'}
                    `}>
                        {isEditing ? <Unlock size={14}/> : <Lock size={14}/>}
                        <span>{isEditing ? 'EDIT_MODE' : 'READ_ONLY'}</span>
                    </div>

                    {!isEditing ? (
                         <NeonButton variant="secondary" onClick={() => setIsEditing(true)} icon={<Settings2 size={14}/>}>
                            编辑配置
                         </NeonButton>
                    ) : (
                         <div className="flex gap-2">
                            <NeonButton variant="ghost" onClick={() => setIsEditing(false)}>取消</NeonButton>
                            <NeonButton variant="primary" onClick={() => setShowSaveConfirm(true)} icon={isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}>
                                {isSaving ? '同步中...' : '保存'}
                            </NeonButton>
                         </div>
                    )}
                </div>
            </div>

            {/* ==================== PART 1: FRONTEND CONFIG ==================== */}
            <div className="space-y-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Globe className="text-primary" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-tight">前台配置</h2>
                </div>

                <div className="flex flex-col gap-8">
                    {/* 1.1 Meta & SEO */}
                    <GlassCard className="w-full">
                        <SectionTitle icon={Globe} title="SEO 元信息配置" />
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CyberInput label="站点名称" value={frontend.siteName} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteName: e.target.value})} />
                                {/* Favicon Upload - New Design */}
                                <div className="flex items-center gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <div 
                                        onClick={() => isEditing && faviconInputRef.current?.click()}
                                        className={`relative w-16 h-16 rounded-xl bg-[#0F111A] border border-white/10 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group hover:border-primary/50 transition-colors shadow-lg
                                        ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        {frontend.faviconUrl ? (
                                            <img src={frontend.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Globe size={24} className="text-slate-600" />
                                        )}
                                        {isEditing && (
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                        )}
                                        <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={handleFaviconUpload} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
                                            网站图标源
                                        </label>
                                        <div className="relative">
                                             <input 
                                                className={`w-full bg-[#0F111A] text-slate-200 border border-white/[0.08] rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary/50 transition-all placeholder-slate-600 text-base
                                                ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                                value={frontend.faviconUrl}
                                                onChange={(e) => setFrontend({...frontend, faviconUrl: e.target.value})}
                                                disabled={!isEditing}
                                                placeholder="https://... 或点击左侧上传"
                                             />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">支持 .ico, .png, .svg 格式</p>
                                    </div>
                                </div>
                            </div>
                            <CyberInput label="SEO 标题" value={frontend.siteTitle} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteTitle: e.target.value})} />
                            <CyberInput label="SEO 描述" value={frontend.siteDescription} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteDescription: e.target.value})} />
                            <CyberInput label="SEO 关键词" value={frontend.siteKeywords} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteKeywords: e.target.value})} />
                        </div>
                    </GlassCard>

                    {/* 1.2 Theme Settings */}
                    <GlassCard className="w-full">
                        <SectionTitle icon={Palette} title="主题与外观设置" />
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-400">主题模式</label>
                                <select 
                                    className={`w-full bg-[#0F111A] text-slate-200 border border-white/[0.08] rounded-xl px-4 py-3.5 text-base focus:border-primary/50 transition-all ${!isEditing && 'opacity-60 cursor-not-allowed bg-white/[0.02]'}`}
                                    value={frontend.themeMode}
                                    disabled={!isEditing}
                                    onChange={e => setFrontend({...frontend, themeMode: e.target.value as any})}
                                >
                                    <option value="single">单主题模式</option>
                                    <option value="day-night">日夜切换模式</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Default Theme Select */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
                                        {frontend.themeMode === 'single' ? "默认主题" : "日间主题"}
                                    </label>
                                    <select 
                                        className={`w-full bg-[#0F111A] text-slate-200 border border-white/[0.08] rounded-xl px-4 py-3.5 text-base focus:border-primary/50 transition-all ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                        value={frontend.themeDefault}
                                        disabled={!isEditing}
                                        onChange={e => setFrontend({...frontend, themeDefault: e.target.value})}
                                    >
                                        {MOCK_THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                
                                {frontend.themeMode === 'day-night' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">夜间主题</label>
                                        <select 
                                            className={`w-full bg-[#0F111A] text-slate-200 border border-white/[0.08] rounded-xl px-4 py-3.5 text-base focus:border-primary/50 transition-all ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                            value={frontend.themeDark}
                                            disabled={!isEditing}
                                            onChange={e => setFrontend({...frontend, themeDark: e.target.value})}
                                        >
                                            {MOCK_THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                 <Toggle 
                                    label="启用季节特效" 
                                    subLabel="如樱花飘落、雪花等前景装饰动画"
                                    checked={frontend.enableSeasonEffect} 
                                    disabled={!isEditing}
                                    onChange={(v: boolean) => setFrontend({...frontend, enableSeasonEffect: v})} 
                                 />
                                 {frontend.enableSeasonEffect && (
                                     <div className="mt-4 grid grid-cols-4 gap-2">
                                         {['sakura', 'snow', 'leaves', 'none'].map(effect => (
                                             <button 
                                                key={effect}
                                                disabled={!isEditing}
                                                onClick={() => setFrontend({...frontend, seasonEffectType: effect as any})}
                                                className={`
                                                    py-2.5 rounded-lg text-sm font-medium border transition-all
                                                    ${frontend.seasonEffectType === effect ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-500 hover:bg-white/5'}
                                                    ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                                `}
                                             >
                                                 {effect === 'sakura' ? '樱花' : 
                                                  effect === 'snow' ? '飞雪' : 
                                                  effect === 'leaves' ? '落叶' : '无'}
                                             </button>
                                         ))}
                                     </div>
                                 )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* 1.3 Components Config - Re-layout to 2 Columns */}
                    <GlassCard className="w-full">
                        <SectionTitle icon={Layout} title="功能组件配置" badge="功能开关" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: General Components */}
                            <div className="space-y-6">
                                {/* Author Card */}
                                <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 ${!isEditing && 'opacity-80'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                            <UserCircle size={16} /> 作者名片
                                        </div>
                                        <input type="checkbox" className="accent-primary w-4 h-4" checked={frontend.enableAuthorCard} disabled={!isEditing} onChange={e => setFrontend({...frontend, enableAuthorCard: e.target.checked})} />
                                    </div>
                                    {frontend.enableAuthorCard && (
                                        <div className="flex gap-2 pt-2">
                                            {['minimal', 'detailed'].map(style => (
                                                <button 
                                                    key={style}
                                                    disabled={!isEditing}
                                                    onClick={() => setFrontend({...frontend, authorCardStyle: style as any})}
                                                    className={`
                                                        flex-1 py-1.5 text-xs rounded border transition-colors 
                                                        ${frontend.authorCardStyle === style ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-500'}
                                                        ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                                    `}
                                                >
                                                    {style === 'minimal' ? '极简版' : '详细版'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Pagination & Reco */}
                                <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 ${!isEditing && 'opacity-80'}`}>
                                    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm mb-2">
                                        <FileText size={16} /> 分页与推荐设置
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase">每页文章数</label>
                                            <input type="number" disabled={!isEditing} className="w-full bg-[#0F111A] text-white text-base border border-white/10 rounded-xl p-3 mt-1 disabled:opacity-50" value={frontend.pageSize} onChange={e => setFrontend({...frontend, pageSize: parseInt(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase">推荐模式</label>
                                            <select disabled={!isEditing} className="w-full bg-[#0F111A] text-white text-base border border-white/10 rounded-xl p-3 mt-1 disabled:opacity-50" value={frontend.recommendationMode} onChange={e => setFrontend({...frontend, recommendationMode: e.target.value as any})}>
                                                <option value="tag">按标签</option>
                                                <option value="date">按日期</option>
                                                <option value="random">随机</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Character Dialog (Full Column) */}
                            <div className={`p-5 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 flex flex-col h-full ${!isEditing ? 'opacity-80' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                        <Users size={16} /> 角色对话组件
                                    </div>
                                    <input type="checkbox" className="accent-primary w-4 h-4" checked={frontend.enableCharacters} disabled={!isEditing} onChange={e => setFrontend({...frontend, enableCharacters: e.target.checked})} />
                                </div>
                                
                                {frontend.enableCharacters && (
                                    <div className="flex-1 flex flex-col min-h-[300px]">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs text-slate-500 uppercase">活跃角色列表</label>
                                            <button 
                                                disabled={!isEditing} 
                                                onClick={addCharacter}
                                                className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={12} /> 添加角色
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
                                            {frontend.activeCharacters.map((char) => (
                                                <div key={char.id} className="p-3 bg-[#0B0C15] border border-white/5 rounded-xl flex items-center gap-3 group hover:border-white/10 transition-colors">
                                                    {/* Char Avatar Upload */}
                                                    <div 
                                                        className={`w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative ${isEditing ? 'hover:border-primary/50' : ''}`}
                                                        onClick={() => isEditing && charInputRefs.current[char.id]?.click()}
                                                    >
                                                        {char.avatar ? (
                                                            <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs font-bold text-slate-500">{char.name.charAt(0)}</span>
                                                        )}
                                                        {isEditing && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                <Upload size={12} className="text-white" />
                                                            </div>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*"
                                                            ref={(el) => { charInputRefs.current[char.id] = el; }}
                                                            onChange={(e) => handleCharAvatarUpload(char.id, e)}
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-1">
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-transparent text-sm text-white font-medium focus:outline-none border-b border-transparent focus:border-primary placeholder-slate-600"
                                                            value={char.name}
                                                            placeholder="角色名称"
                                                            disabled={!isEditing}
                                                            onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-1.5 h-1.5 rounded-full ${char.enable ? 'bg-success shadow-[0_0_4px_#50fa7b]' : 'bg-slate-600'}`}></span>
                                                            <span className="text-[10px] text-slate-500 font-mono">{char.enable ? 'ACTIVE' : 'DISABLED'}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button 
                                                            disabled={!isEditing}
                                                            onClick={() => updateCharacter(char.id, 'enable', !char.enable)}
                                                            className={`p-1.5 rounded hover:bg-white/10 ${char.enable ? 'text-success' : 'text-slate-500'} disabled:opacity-50`}
                                                            title="切换状态"
                                                        >
                                                            <Power size={12} />
                                                        </button>
                                                        <button 
                                                            disabled={!isEditing}
                                                            onClick={() => removeCharacter(char.id)}
                                                            className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 disabled:opacity-50"
                                                            title="删除角色"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {frontend.activeCharacters.length === 0 && (
                                                <div className="text-center py-6 text-sm text-slate-500 border border-dashed border-white/10 rounded-xl">
                                                    暂无活跃角色
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </GlassCard>

                    {/* 1.4 Navigation & Social */}
                    <GlassCard className="w-full">
                         <SectionTitle icon={LinkIcon} title="导航菜单与社交链接" />
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             {/* Nav Menu */}
                             <div className={!isEditing ? 'pointer-events-none opacity-80' : ''}>
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-sm font-bold text-slate-400 uppercase">导航菜单管理</h4>
                                     <button disabled={!isEditing} onClick={handleAddNav} className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"><Plus size={14}/></button>
                                 </div>
                                 <div className="space-y-3">
                                     {frontend.navLinks.map((nav, idx) => (
                                         <div key={nav.id} className="flex gap-2 items-center bg-[#0F111A] p-2 rounded-lg border border-white/5 overflow-hidden">
                                             <span className="text-xs font-mono text-slate-600 w-4 shrink-0 text-center">{idx+1}</span>
                                             <input 
                                                 disabled={!isEditing} 
                                                 className="bg-transparent text-sm text-white border-b border-transparent focus:border-primary w-20 sm:w-24 outline-none disabled:opacity-50 shrink-0 placeholder-slate-700 transition-all" 
                                                 value={nav.label} 
                                                 placeholder="名称"
                                                 onChange={e => updateNav(nav.id, 'label', e.target.value)} 
                                             />
                                             <input 
                                                 disabled={!isEditing} 
                                                 className="bg-transparent text-sm text-slate-400 border-b border-transparent focus:border-primary flex-1 min-w-0 outline-none font-mono disabled:opacity-50 placeholder-slate-700 transition-all" 
                                                 value={nav.path} 
                                                 placeholder="路径 / URL"
                                                 onChange={e => updateNav(nav.id, 'path', e.target.value)} 
                                             />
                                             <button 
                                                 disabled={!isEditing} 
                                                 onClick={() => updateNav(nav.id, 'enableExternal', !nav.enableExternal)} 
                                                 className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 transition-colors whitespace-nowrap ${nav.enableExternal ? 'border-warning text-warning' : 'border-slate-700 text-slate-600'} disabled:opacity-50`}
                                                 title="是否开启外链跳转"
                                             >
                                                 {nav.enableExternal ? '外链' : '内链'}
                                             </button>
                                             <button 
                                                 disabled={!isEditing} 
                                                 onClick={() => removeNav(nav.id)} 
                                                 className="text-slate-600 hover:text-red-400 disabled:opacity-50 shrink-0 p-1"
                                             >
                                                 <Trash2 size={12}/>
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                             
                             {/* Social Links */}
                             <div className={!isEditing ? 'pointer-events-none opacity-80' : ''}>
                                 <div className="flex justify-between items-center mb-4">
                                     <h4 className="text-sm font-bold text-slate-400 uppercase">社交联系方式</h4>
                                     <button disabled={!isEditing} onClick={handleAddSocial} className="p-1 rounded bg-secondary/10 text-secondary hover:bg-secondary/20 disabled:opacity-50"><Plus size={14}/></button>
                                 </div>
                                 <div className="space-y-3">
                                     {frontend.socialLinks.map((social) => (
                                         <div key={social.id} className="flex gap-2 items-center bg-[#0F111A] p-2 rounded-lg border border-white/5 overflow-hidden">
                                             <input 
                                                 disabled={!isEditing} 
                                                 className="bg-transparent text-sm text-white border-b border-transparent focus:border-secondary w-20 sm:w-28 outline-none disabled:opacity-50 shrink-0 placeholder-slate-700 transition-all" 
                                                 value={social.platform} 
                                                 placeholder="平台"
                                                 onChange={e => updateSocial(social.id, 'platform', e.target.value)} 
                                             />
                                             <input 
                                                 disabled={!isEditing} 
                                                 className="bg-transparent text-sm text-slate-400 border-b border-transparent focus:border-secondary flex-1 min-w-0 outline-none font-mono disabled:opacity-50 placeholder-slate-700 transition-all" 
                                                 value={social.url} 
                                                 placeholder="URL 链接"
                                                 onChange={e => updateSocial(social.id, 'url', e.target.value)} 
                                             />
                                             <button 
                                                 disabled={!isEditing} 
                                                 onClick={() => removeSocial(social.id)} 
                                                 className="text-slate-600 hover:text-red-400 disabled:opacity-50 shrink-0 p-1"
                                             >
                                                 <Trash2 size={12}/>
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>
                    </GlassCard>

                    {/* 1.5 Site Mode */}
                    <GlassCard className="w-full">
                        <SectionTitle icon={Power} title="站点运行模式" />
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div 
                                onClick={() => isEditing && setFrontend({...frontend, siteMode: 'normal'})}
                                className={`
                                    p-4 rounded-xl border transition-all 
                                    ${frontend.siteMode === 'normal' ? 'bg-success/10 border-success text-white' : 'bg-white/5 border-white/10 text-slate-500 opacity-60 hover:opacity-100'}
                                    ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex items-center gap-2 mb-2 font-bold"><Zap size={18}/> 正常模式</div>
                                <p className="text-xs opacity-80">正常模式：优化读者体验，开放所有访问权限。</p>
                            </div>
                            <div 
                                onClick={() => isEditing && setFrontend({...frontend, siteMode: 'maintenance'})}
                                className={`
                                    p-4 rounded-xl border transition-all 
                                    ${frontend.siteMode === 'maintenance' ? 'bg-warning/10 border-warning text-white' : 'bg-white/5 border-white/10 text-slate-500 opacity-60 hover:opacity-100'}
                                    ${!isEditing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                                `}
                            >
                                <div className="flex items-center gap-2 mb-2 font-bold"><Shield size={18}/> 维护模式</div>
                                <p className="text-xs opacity-80">维护模式：重定向所有流量至维护页面，仅管理员可访问。</p>
                            </div>
                         </div>
                    </GlassCard>
                </div>
            </div>

            {/* ==================== PART 2: BACKEND CONFIG ==================== */}
            <div className="space-y-8 border-t border-white/10 pt-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Server className="text-secondary" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-tight">后台配置</h2>
                </div>

                <div className="flex flex-col gap-8">
                    {/* 2.1 SEO & Visuals */}
                    <GlassCard className="w-full">
                         <SectionTitle icon={Monitor} title="SEO 增强与视觉特效" />
                         <div className="space-y-6">
                             <Toggle 
                                label="增强型 SEO" 
                                subLabel="自动注入管理后台 Meta 信息"
                                checked={backend.enableEnhancedSeo} 
                                disabled={!isEditing}
                                onChange={(v: boolean) => setBackend({...backend, enableEnhancedSeo: v})} 
                             />
                             {backend.enableEnhancedSeo && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                     <CyberInput label="后台标题" value={backend.adminTitle} disabled={!isEditing} onChange={e => setBackend({...backend, adminTitle: e.target.value})} />
                                     <CyberInput label="后台图标" value={backend.adminFavicon} disabled={!isEditing} onChange={e => setBackend({...backend, adminFavicon: e.target.value})} />
                                 </div>
                             )}

                             <div className="pt-4 border-t border-white/5">
                                 <Toggle 
                                    label="后台背景特效" 
                                    checked={backend.enableBgEffect} 
                                    disabled={!isEditing}
                                    onChange={(v: boolean) => setBackend({...backend, enableBgEffect: v})} 
                                    color="text-accent"
                                 />
                                 {backend.enableBgEffect && (
                                     <div className="mt-4 space-y-4">
                                         <select 
                                            className={`w-full bg-[#0F111A] text-accent border border-white/[0.08] rounded-xl px-4 py-3 text-base ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                            value={backend.activeEffectMode}
                                            disabled={!isEditing}
                                            onChange={e => setBackend({...backend, activeEffectMode: e.target.value as any})}
                                        >
                                            <option value="SNOW_FALL">飞雪 (Snow Fall)</option>
                                            <option value="MATRIX_RAIN">黑客帝国 (Matrix Rain)</option>
                                            <option value="NEON_AMBIENT">霓虹氛围 (Neon Ambient)</option>
                                            <option value="TERMINAL_GRID">终端网格 (Terminal Grid)</option>
                                        </select>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase">特效强度: {backend.effectIntensity}</label>
                                            <input 
                                                type="range" min="0.1" max="1.0" step="0.1" 
                                                className={`
                                                    w-full h-4 bg-white/10 rounded-lg appearance-none mt-2
                                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_#ff79c6]
                                                    ${isEditing ? 'cursor-pointer hover:bg-white/20' : 'cursor-not-allowed opacity-50'}
                                                `}
                                                value={backend.effectIntensity} 
                                                disabled={!isEditing}
                                                onChange={e => setBackend({...backend, effectIntensity: parseFloat(e.target.value)})} 
                                            />
                                        </div>
                                     </div>
                                 )}
                             </div>
                         </div>
                    </GlassCard>

                    {/* 2.2 Editor & Data */}
                    <GlassCard className="w-full">
                         <SectionTitle icon={PenTool} title="编辑器与数据策略" />
                         <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <CyberInput 
                                    type="number"
                                    label="回收站缓存 (天)" 
                                    value={backend.recycleBinRetentionDays} 
                                    disabled={!isEditing}
                                    onChange={e => setBackend({...backend, recycleBinRetentionDays: parseInt(e.target.value)})} 
                                 />
                                 <CyberInput 
                                    type="number"
                                    label="自动保存间隔 (秒)" 
                                    value={backend.autoSaveInterval} 
                                    disabled={!isEditing}
                                    onChange={e => setBackend({...backend, autoSaveInterval: parseInt(e.target.value)})} 
                                 />
                             </div>

                             <div className="space-y-2 pt-2">
                                 <Toggle 
                                    label="预览加载封面" 
                                    subLabel="在列表预览模式下预加载封面图 (消耗流量)"
                                    checked={backend.previewLoadCover} 
                                    disabled={!isEditing}
                                    onChange={(v: boolean) => setBackend({...backend, previewLoadCover: v})} 
                                 />
                                 <Toggle 
                                    label="图片压缩" 
                                    subLabel="上传时自动压缩图片 (WebP)"
                                    checked={backend.enableImgCompression} 
                                    disabled={!isEditing}
                                    onChange={(v: boolean) => setBackend({...backend, enableImgCompression: v})} 
                                    color="text-success"
                                 />
                             </div>
                             
                             <div className="pt-4 border-t border-white/5">
                                 <div className={`
                                     p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300
                                     ${backend.maintenanceMode ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/5'} 
                                     ${!isEditing && 'opacity-60'}
                                 `}>
                                     <div className="flex items-start gap-4">
                                         <div className={`p-3 rounded-full ${backend.maintenanceMode ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                                            <AlertTriangle size={24} />
                                         </div>
                                         <div>
                                             <span className={`text-base font-bold ${backend.maintenanceMode ? 'text-red-400' : 'text-slate-300'}`}>后台维护模式</span>
                                             <span className="text-xs block text-slate-500 mt-1 max-w-md leading-relaxed">
                                                 开启后，普通管理员将无法登录后台，API 将返回 503 状态码。仅限超级管理员通过 SSH 或数据库直接访问。
                                             </span>
                                         </div>
                                     </div>
                                     <button
                                        onClick={() => {
                                            if (isEditing) {
                                                setPendingMaintState(!backend.maintenanceMode);
                                                setShowMaintConfirm(true);
                                            }
                                        }}
                                        disabled={!isEditing}
                                        className={`
                                            px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all
                                            ${backend.maintenanceMode 
                                                ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                                                : 'bg-transparent text-slate-400 border-slate-600 hover:border-white hover:text-white'}
                                            ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}
                                        `}
                                     >
                                         {backend.maintenanceMode ? '关闭维护模式' : '开启维护模式'}
                                     </button>
                                 </div>
                             </div>
                         </div>
                    </GlassCard>
                </div>
            </div>

            {/* --- Modals --- */}
            
            {/* Save Confirmation */}
            <ConfirmModal 
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={triggerSave}
                title="保存配置确认"
                message="即将覆盖系统核心配置。请确认所有更改已核对无误，这可能会立即影响前台站点的显示或后台服务的可用性。"
                type="primary"
                confirmText="保存"
            />

            {/* Maintenance Mode Confirmation */}
            <ConfirmModal 
                isOpen={showMaintConfirm}
                onClose={() => setShowMaintConfirm(false)}
                onConfirm={toggleMaintenance}
                title={pendingMaintState ? "⚠️ 开启维护模式警告" : "关闭维护模式"}
                message={pendingMaintState 
                    ? "开启维护模式将强制中断所有非 Root 用户的会话，并暂停对外服务。请确保您已通过其他方式（如 SSH）建立了紧急访问通道。" 
                    : "确认关闭维护模式？服务将恢复正常，用户可正常登录。"
                }
                type="danger"
                confirmText="确认执行"
            />
        </div>
    );
};
