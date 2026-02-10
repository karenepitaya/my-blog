import React, { useCallback, useEffect, useState, useRef } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { NeonButton } from '../../NeoShared/ui/NeonButton';
import { CyberInput } from '../../NeoShared/ui/CyberInput';
import { ConfirmModal } from '../../NeoShared/ui/ConfirmModal';
import { InlineSwitch } from '../../NeoShared/ui/InlineSwitch';
import { FloatingTextEditorModal } from '../../NeoShared/ui/FloatingTextEditorModal';
import { useNeoToast } from '../../NeoShared/ui/Toast';
import { AdminSystemConfig, FrontendSiteConfig, NavLinkConfig, SocialLinkConfig, CharacterConfig } from '../types';
import type {
  NavLink,
  SocialLinks,
  SystemConfig as RealSystemConfig,
  ThemesConfig,
  ThemeMode,
  VisualEffectMode,
} from '../../../types';
import { INITIAL_CONFIG } from '../../../constants';
import { 
    Save, RefreshCw, Settings2, Globe, Palette, Layout, Link as LinkIcon, 
    Users, UserCircle, FileText, Zap, Trash2, Plus, 
    Monitor, Server, PenTool, Power, Lock, Unlock, Upload, AlertTriangle, Camera, HelpCircle, Maximize2, X
} from 'lucide-react';

type ThemeOption = { value: string; label: string };

const ALL_BUILTIN_THEMES = (INITIAL_CONFIG.frontend.themes.include ?? []).map(t => String(t).trim()).filter(Boolean);

function kebabToTitleCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function themeLabel(themeId: string): string {
    const normalized = String(themeId ?? '').trim();
    if (!normalized) return '';
    if (normalized === 'auto') return 'Auto (System)';
    return kebabToTitleCase(normalized);
}

function toThemeOptions(themeIds: string[]): ThemeOption[] {
    const seen = new Set<string>();
    const options: ThemeOption[] = [];
    for (const raw of themeIds ?? []) {
        const value = String(raw ?? '').trim();
        if (!value || seen.has(value)) continue;
        seen.add(value);
        options.push({ value, label: themeLabel(value) });
    }
    return options;
}

function isLightTheme(themeId: string): boolean {
    const id = String(themeId ?? '').trim().toLowerCase();
    if (!id) return false;

    const explicitLight = new Set([
        'catppuccin-latte',
        'everforest-light',
        'github-light',
        'github-light-default',
        'github-light-high-contrast',
        'gruvbox-light-hard',
        'gruvbox-light-medium',
        'gruvbox-light-soft',
        'light-plus',
        'min-light',
        'one-light',
        'rose-pine-dawn',
        'snazzy-light',
        'solarized-light',
        'slack-ochin',
        'vitesse-light',
    ]);
    if (explicitLight.has(id)) return true;

    if (id.includes('light')) return true;
    if (id.includes('latte')) return true;
    if (id.includes('dawn')) return true;

    return false;
}

const ALL_THEME_OPTIONS: ThemeOption[] = toThemeOptions(ALL_BUILTIN_THEMES);
const DAY_THEME_OPTIONS: ThemeOption[] = ALL_THEME_OPTIONS.filter(opt => isLightTheme(opt.value));
const NIGHT_THEME_OPTIONS: ThemeOption[] = ALL_THEME_OPTIONS.filter(opt => !isLightTheme(opt.value));

function ensureThemeOption(options: ThemeOption[], value: string | undefined): ThemeOption[] {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return options;
    if (options.some(opt => opt.value === trimmed)) return options;
    return [{ value: trimmed, label: themeLabel(trimmed) || trimmed }, ...options];
}

function normalizeList(values: string[], max = 200): string[] {
    const next = (values ?? []).map(v => String(v ?? '').trim()).filter(Boolean);
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of next) {
        if (seen.has(value)) continue;
        seen.add(value);
        result.push(value);
        if (result.length >= max) break;
    }
    return result;
}

function getErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error && err.message ? err.message : fallback;
}

function pickFirst(options: ThemeOption[], fallback: string): string {
    return String(options?.[0]?.value ?? fallback).trim() || fallback;
}

function pickFirstNot(options: ThemeOption[], notValue: string, fallback: string): string {
    const normalizedNot = String(notValue ?? '').trim();
    for (const opt of options ?? []) {
        const value = String(opt.value ?? '').trim();
        if (value && value !== normalizedNot) return value;
    }
    return fallback;
}

type ToggleProps = {
    checked: boolean;
    onChange: (next: boolean) => void;
    label: string;
    subLabel?: string;
    color?: string;
    disabled?: boolean;
};

const Toggle = ({ checked, onChange, label, subLabel, color = 'text-fg', disabled }: ToggleProps) => (
    <div 
        onClick={() => !disabled && onChange(!checked)}
        className={`
            flex items-center justify-between gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl transition-all group
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/[0.05]'}
        `}
    >
        <div className="flex-1 min-w-0">
            <span className={`text-base font-semibold ${color} group-hover:text-white transition-colors block truncate`}>{label}</span>
            {subLabel && <span className="text-sm text-muted mt-1 block truncate">{subLabel}</span>}
        </div>
        <div className={`shrink-0 w-11 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-primary' : 'bg-white/10'}`}>
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
    </div>
);

const HelpButton = ({ title, onClick, disabled }: { title: string; onClick: () => void; disabled?: boolean }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="shrink-0 p-2 rounded-lg border border-border bg-fg/3 text-muted hover:text-fg hover:border-fg/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        <HelpCircle size={16} />
    </button>
);

type SectionTitleProps = {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
    badge?: string;
};

const SectionTitle = ({ icon: Icon, title, badge }: SectionTitleProps) => (
    <div className="flex items-center gap-3 mb-6 text-muted border-b border-border pb-4">
            <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary border border-border">
             <Icon size={18} />
        </div>
        <h3 className="text-base font-semibold tracking-wide text-fg">{title}</h3>
        {badge && <span className="ml-auto text-xs px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">{badge}</span>}
    </div>
);

export type SystemTabProps = {
    config: RealSystemConfig;
    onUpdate: (config: RealSystemConfig) => Promise<RealSystemConfig | null>;
    onPublish: (config: RealSystemConfig) => Promise<RealSystemConfig | null>;
    onPreviewTheme: (input: {
        themes: RealSystemConfig['frontend']['themes'];
        enableSeasonEffect?: boolean;
        seasonEffectType?: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
        seasonEffectIntensity?: number;
    }) => Promise<{ path: string } | null>;
    onPreviewAll: (config: RealSystemConfig) => Promise<{ previewPath: string; frontendSiteConfigPath: string; appliedAt: number } | null>;
    onUploadFavicon: (file: File) => Promise<string>;
    onUploadCharacterAvatar: (file: File) => Promise<string>;
};

const splitKeywords = (raw: string) =>
    raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.slice(0, 50))
        .slice(0, 30);

const joinKeywords = (tags: string[]) => tags.join(', ');

const socialKeyByPlatform = (platform: string): keyof SocialLinks | null => {
    const normalized = platform.trim().toLowerCase();
    if (normalized === 'github' || normalized === 'gitHub') return 'github';
    if (normalized === 'twitter') return 'twitter';
    if (normalized === 'mastodon') return 'mastodon';
    if (normalized === 'bluesky' || normalized === 'blueSky') return 'bluesky';
    if (normalized === 'linkedin' || normalized === 'linkedIn') return 'linkedin';
    if (normalized === 'email' || normalized === 'mail') return 'email';
    return null;
};

const toUiNavLinks = (links: NavLink[]): NavLinkConfig[] =>
    (links ?? []).map((l, idx) => ({
        id: String(idx + 1),
        label: l.name,
        path: l.url,
        enableExternal: Boolean(l.external),
        visible: true,
    }));

const toServerNavLinks = (links: NavLinkConfig[]): NavLink[] =>
    (links ?? [])
        .filter(l => l.visible)
        .map(l => ({
            name: String(l.label ?? '').trim() || 'Link',
            url: String(l.path ?? '').trim() || '/',
            ...(l.enableExternal ? { external: true } : {}),
        }));

const toUiSocialLinks = (social: SocialLinks): SocialLinkConfig[] => {
    const entries: Array<[string, string | undefined]> = [
        ['Github', social?.github],
        ['Twitter', social?.twitter],
        ['Mastodon', social?.mastodon],
        ['Bluesky', social?.bluesky],
        ['LinkedIn', social?.linkedin],
        ['Email', social?.email],
    ];

    return entries
        .filter(([, url]) => typeof url === 'string' && url.trim().length > 0)
        .map(([platform, url], idx) => ({
            id: String(idx + 1),
            platform,
            url: url as string,
            visible: true,
        }));
};

const toServerSocialLinks = (links: SocialLinkConfig[]): SocialLinks => {
    const result: SocialLinks = {};
    for (const link of links ?? []) {
        if (!link.visible) continue;
        const key = socialKeyByPlatform(link.platform);
        const url = String(link.url ?? '').trim();
        if (!key || !url) continue;
        result[key] = url;
    }
    return result;
};

const toUiFromConfig = (config: RealSystemConfig): { frontend: FrontendSiteConfig; backend: AdminSystemConfig } => {
    const themes = config.frontend.themes;
    const serverMode = themes?.mode;
    const mode: FrontendSiteConfig['themeMode'] =
        serverMode === 'single' ? 'single' : serverMode === 'light-dark-auto' ? 'day-night' : 'select';

    const defaultLight = pickFirst(DAY_THEME_OPTIONS, ALL_BUILTIN_THEMES[0] ?? 'catppuccin-latte');
    const defaultDark = pickFirst(NIGHT_THEME_OPTIONS, ALL_BUILTIN_THEMES[0] ?? 'catppuccin-mocha');
    const includeList = Array.isArray(themes?.include) ? themes!.include.map(String) : [];

    const themeDefault =
        mode === 'day-night'
            ? String(includeList[0] ?? defaultLight).trim() || defaultLight
            : String(themes?.default ?? includeList[0] ?? defaultDark).trim() || defaultDark;

    const themeDark =
        mode === 'day-night'
            ? String(includeList[1] ?? pickFirstNot(NIGHT_THEME_OPTIONS, themeDefault, defaultDark)).trim() ||
              pickFirstNot(NIGHT_THEME_OPTIONS, themeDefault, defaultDark)
            : undefined;

    const themeInclude =
        serverMode === 'select' && includeList.length > 0 ? normalizeList(includeList) : normalizeList(ALL_BUILTIN_THEMES);

    const activeCharacters: CharacterConfig[] = (() => {
        const raw = config.frontend.activeCharacters;
        if (Array.isArray(raw) && raw.length > 0) {
            return raw.map((c, idx: number) => ({
                id: String(c?.id ?? idx + 1),
                name: String(c?.name ?? 'Role').trim() || 'Role',
                avatar: String(c?.avatar ?? ''),
                enable: Boolean(c?.enable ?? true),
            }));
        }
        return Object.entries(config.frontend.characters ?? {}).map(([name, avatar], idx) => ({
            id: String(idx + 1),
            name,
            avatar,
            enable: true,
        }));
    })();

    const enableSeasonEffect =
        typeof config.frontend.enableSeasonEffect === 'boolean' ? config.frontend.enableSeasonEffect : true;
    const seasonEffectTypeRaw = String(config.frontend.seasonEffectType ?? 'snow');
    const normalizeSeasonEffectType = (value: string): FrontendSiteConfig['seasonEffectType'] => {
        const v = String(value ?? '').trim();
        if (
            v === 'sakura' ||
            v === 'snow' ||
            v === 'leaves' ||
            v === 'fireflies' ||
            v === 'anniversary' ||
            v === 'none' ||
            v === 'auto'
        )
            return v;
        return 'auto';
    };
    const seasonEffectType = normalizeSeasonEffectType(
        enableSeasonEffect && (seasonEffectTypeRaw === 'none' || !seasonEffectTypeRaw) ? 'auto' : seasonEffectTypeRaw
    );
    const seasonEffectIntensityRaw = Number(config.frontend.seasonEffectIntensity);
    const seasonEffectIntensity = (() => {
        const base = Number.isFinite(seasonEffectIntensityRaw)
            ? Math.min(1, Math.max(0, seasonEffectIntensityRaw))
            : 0.8;
        return enableSeasonEffect ? Math.min(1, Math.max(0.1, base)) : base;
    })();
    const enableAnniversaryEffect =
        enableSeasonEffect && typeof config.frontend.enableAnniversaryEffect === 'boolean'
            ? Boolean(config.frontend.enableAnniversaryEffect)
            : false;
    const legacyEnableAuthorCard =
        typeof config.frontend.enableAuthorCard === 'boolean' ? config.frontend.enableAuthorCard : true;
    const enableAboutAuthorCard = true;
    const enableFooterAuthorCard =
        typeof config.frontend.enableFooterAuthorCard === 'boolean'
            ? Boolean(config.frontend.enableFooterAuthorCard)
            : legacyEnableAuthorCard;
    const authorCardStyle: FrontendSiteConfig['authorCardStyle'] =
        config.frontend.authorCardStyle ?? 'detailed';
    const enableRecommendations =
        typeof config.frontend.enableRecommendations === 'boolean' ? config.frontend.enableRecommendations : true;
    const recommendationMode: FrontendSiteConfig['recommendationMode'] =
        config.frontend.recommendationMode ?? 'tag';
    const enableCharacters =
        typeof config.frontend.enableCharacters === 'boolean' ? config.frontend.enableCharacters : true;

    const defaultPageSize = 6;
    const homePageSizeRaw = Number(config.frontend.homePageSize);
    const homePageSize = Number.isFinite(homePageSizeRaw) ? Math.max(1, Math.min(19, Math.floor(homePageSizeRaw))) : defaultPageSize;
    const archivePageSizeRaw = Number(config.frontend.archivePageSize);
    const archivePageSize = Number.isFinite(archivePageSizeRaw) ? Math.max(1, Math.min(19, Math.floor(archivePageSizeRaw))) : defaultPageSize;
    const categoryPageSizeRaw = Number(config.frontend.categoryPageSize);
    const categoryPageSize = Number.isFinite(categoryPageSizeRaw) ? Math.max(1, Math.min(19, Math.floor(categoryPageSizeRaw))) : defaultPageSize;
    const tagPageSizeRaw = Number(config.frontend.tagPageSize);
    const tagPageSize = Number.isFinite(tagPageSizeRaw) ? Math.max(1, Math.min(19, Math.floor(tagPageSizeRaw))) : defaultPageSize;
    const recommendationCountRaw = Number(config.frontend.recommendationCount);
    const recommendationCount = Number.isFinite(recommendationCountRaw) ? Math.max(1, Math.min(19, Math.floor(recommendationCountRaw))) : 6;

    const siteModeRaw = String(config.frontend.siteMode ?? '').trim();
    const siteMode: FrontendSiteConfig['siteMode'] =
        siteModeRaw === 'maintenance' ? 'maintenance' : (config.admin.maintenanceMode ? 'maintenance' : 'normal');
    const maintenanceRaw = config.frontend.maintenance ?? {};
    const maintenance = {
        startAt: String(maintenanceRaw.startAt ?? '').trim(),
        endAt: String(maintenanceRaw.endAt ?? '').trim(),
        reason: String(maintenanceRaw.reason ?? '').trim(),
    };

    const frontend: FrontendSiteConfig = {
        siteUrl: config.frontend.site ?? '',
        siteName: config.admin.siteName ?? '',
        siteTitle: config.frontend.title ?? '',
        siteDescription: config.frontend.description ?? '',
        siteKeywords: joinKeywords(config.frontend.tags ?? []),
        siteAuthor: config.frontend.author ?? '',
        faviconUrl: config.frontend.faviconUrl ?? '',
        socialCardAvatarImage: config.frontend.socialCardAvatarImage ?? '',
        themeMode: mode,
        themeDefault,
        themeDark,
        themeInclude,
        enableSeasonEffect,
        seasonEffectType,
        seasonEffectIntensity,
        enableAnniversaryEffect,
        enableGiscus: Boolean(config.frontend.giscus?.repo),
        giscusRepo: String(config.frontend.giscus?.repo ?? ''),
        giscusCategory: String(config.frontend.giscus?.category ?? ''),
        enableCharacters,
        activeCharacters,
        enableAboutAuthorCard,
        enableFooterAuthorCard,
        authorCardStyle,
        pageSize: defaultPageSize,
        homePageSize,
        archivePageSize,
        categoryPageSize,
        tagPageSize,
        enableRecommendations,
        recommendationMode,
        recommendationCount,
        navLinks: toUiNavLinks(config.frontend.navLinks ?? []),
        socialLinks: toUiSocialLinks(config.frontend.socialLinks ?? {}),
        siteMode,
        maintenance,
    };

    const rawIntensity = Number(config.admin.effectIntensity);
    const effectIntensity = Number.isFinite(rawIntensity) ? Math.min(1, Math.max(0, rawIntensity)) : 0.8;

    const backend: AdminSystemConfig = {
        enableEnhancedSeo: Boolean(config.admin.enableEnhancedSeo),
        adminTitle: String(config.admin.adminTitle ?? 'MultiTerm Admin'),
        adminFavicon: String(config.admin.adminFavicon ?? '/admin-favicon.png'),
        adminDescription: String(config.admin.siteDescription ?? '').trim(),
        enableBgEffect: typeof config.admin.enableBgEffect === 'boolean' ? config.admin.enableBgEffect : true,
        activeEffectMode: config.admin.activeEffectMode as unknown as AdminSystemConfig['activeEffectMode'],
        effectIntensity,
        recycleBinRetentionDays: config.admin.recycleBinRetentionDays ?? 30,
        autoSaveInterval: config.admin.autoSaveInterval ?? 120,
        previewLoadCover: Boolean(config.admin.previewLoadCover),
        enableImgCompression: Number(config.oss?.imageCompressionQuality ?? 0.8) < 0.999,
        maintenanceMode: Boolean(config.admin.maintenanceMode),
    };

    return { frontend, backend };
};

const buildNextConfig = (
    base: RealSystemConfig,
    frontend: FrontendSiteConfig,
    backend: AdminSystemConfig
): RealSystemConfig => {
    const nextThemes: ThemesConfig = (() => {
        const existing = base.frontend.themes;
        const defaultLight = pickFirst(DAY_THEME_OPTIONS, ALL_BUILTIN_THEMES[0] ?? 'catppuccin-latte');
        const defaultDark = pickFirst(NIGHT_THEME_OPTIONS, ALL_BUILTIN_THEMES[0] ?? 'catppuccin-mocha');
        const themeDefault =
            (frontend.themeDefault || existing.default || existing.include[0] || defaultDark).trim() || defaultDark;
        if (frontend.themeMode === 'single') {
            return { ...existing, mode: 'single' as ThemeMode, default: themeDefault, include: [themeDefault] };
        }
        if (frontend.themeMode === 'day-night') {
            const themeLight = themeDefault || defaultLight;
            const requestedDark = String(frontend.themeDark || existing.include[1] || defaultDark).trim() || defaultDark;
            const themeDark =
                requestedDark !== themeLight ? requestedDark : pickFirstNot(NIGHT_THEME_OPTIONS, themeLight, defaultDark);
            return {
                ...existing,
                mode: 'light-dark-auto' as ThemeMode,
                default: 'auto',
                include: [themeLight, themeDark],
            };
        }

        const includeSource =
            Array.isArray(frontend.themeInclude) && frontend.themeInclude.length > 0
                ? frontend.themeInclude
                : existing.mode === 'select' && Array.isArray(existing.include) && existing.include.length > 0
                    ? existing.include
                    : ALL_BUILTIN_THEMES;
        let include = normalizeList(includeSource);
        if (!include.includes(themeDefault)) include = normalizeList([themeDefault, ...include]);
        return { ...existing, mode: 'select' as ThemeMode, default: themeDefault, include };
    })();

    const nextMaintenanceMode = frontend.siteMode === 'maintenance' || backend.maintenanceMode;

    const nextOssQuality = (() => {
        const raw = Number(base.oss?.imageCompressionQuality);
        const existing = Number.isFinite(raw) ? Math.min(1, Math.max(0.1, raw)) : 0.8;
        return backend.enableImgCompression ? existing : 1;
    })();

    const nextActiveCharacters: CharacterConfig[] = (frontend.activeCharacters ?? []).map(c => ({
        id: String(c.id ?? '').trim() || String(c.name ?? '').trim() || Date.now().toString(),
        name: String(c.name ?? '').trim() || 'Role',
        avatar: String(c.avatar ?? '').trim(),
        enable: true,
    }));
    const nextCharacters: Record<string, string> = {};
    if (frontend.enableCharacters) {
        for (const c of nextActiveCharacters) {
            if (!c.name || !c.avatar) continue;
            nextCharacters[c.name] = c.avatar;
        }
    }

    return {
        ...base,
        admin: {
            ...base.admin,
            siteName: frontend.siteName,
            siteDescription: backend.adminDescription,
            maintenanceMode: nextMaintenanceMode,
            recycleBinRetentionDays: backend.recycleBinRetentionDays,
            autoSaveInterval: backend.autoSaveInterval,
            activeEffectMode: backend.activeEffectMode as unknown as VisualEffectMode,
            enableEnhancedSeo: backend.enableEnhancedSeo,
            adminTitle: backend.adminTitle,
            adminFavicon: backend.adminFavicon,
            enableBgEffect: backend.enableBgEffect,
            effectIntensity: backend.effectIntensity,
            previewLoadCover: backend.previewLoadCover,
        },
        frontend: {
            ...base.frontend,
            site: String(frontend.siteUrl ?? '').trim() || base.frontend.site,
            title: frontend.siteTitle,
            description: frontend.siteDescription,
            author: String(frontend.siteAuthor ?? '').trim() || base.frontend.author,
            tags: splitKeywords(frontend.siteKeywords),
            faviconUrl: frontend.faviconUrl,
            socialCardAvatarImage: String(frontend.socialCardAvatarImage ?? '').trim() || base.frontend.socialCardAvatarImage,
            pageSize: 6,
            homePageSize: frontend.homePageSize,
            archivePageSize: frontend.archivePageSize,
            categoryPageSize: frontend.categoryPageSize,
            tagPageSize: frontend.tagPageSize,
            siteMode: frontend.siteMode,
            themes: nextThemes,
            navLinks: toServerNavLinks(frontend.navLinks),
            socialLinks: toServerSocialLinks(frontend.socialLinks),
            enableSeasonEffect: frontend.enableSeasonEffect,
            seasonEffectType: frontend.seasonEffectType,
            seasonEffectIntensity: frontend.seasonEffectIntensity,
            enableAnniversaryEffect: frontend.enableAnniversaryEffect,
            enableAboutAuthorCard: true,
            enableFooterAuthorCard: frontend.enableFooterAuthorCard,
            enableAuthorCard: true,
            authorCardStyle: frontend.authorCardStyle,
            enableRecommendations: frontend.enableRecommendations,
            recommendationMode: frontend.recommendationMode,
            recommendationCount: frontend.recommendationCount,
            enableCharacters: frontend.enableCharacters,
            activeCharacters: nextActiveCharacters,
            characters: nextCharacters,
            maintenance:
                frontend.maintenance?.startAt || frontend.maintenance?.endAt || frontend.maintenance?.reason
                    ? {
                          startAt: String(frontend.maintenance?.startAt ?? '').trim(),
                          endAt: String(frontend.maintenance?.endAt ?? '').trim(),
                          reason: String(frontend.maintenance?.reason ?? '').trim(),
                      }
                    : undefined,
        },
        oss: {
            ...base.oss,
            imageCompressionQuality: nextOssQuality,
        },
    };
};

export const SystemTab: React.FC<SystemTabProps> = ({ config, onUpdate, onPublish, onPreviewTheme, onPreviewAll, onUploadFavicon, onUploadCharacterAvatar }) => {
    const toast = useNeoToast();
    const initial = toUiFromConfig(config);
    const canUseDevPreview = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';

    const [frontend, setFrontend] = useState<FrontendSiteConfig>(initial.frontend);
    const [backend, setBackend] = useState<AdminSystemConfig>(initial.backend);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [helpModalKey, setHelpModalKey] = useState<null | 'authorCard' | 'pagination' | 'recommendations' | 'maintenance'>(null);
    const [characterAvatarPreviews, setCharacterAvatarPreviews] = useState<Record<string, string>>({});
    const [characterAvatarUploading, setCharacterAvatarUploading] = useState<Record<string, boolean>>({});
    const [characterAvatarErrored, setCharacterAvatarErrored] = useState<Record<string, boolean>>({});
    const seasonEffectOptions: FrontendSiteConfig['seasonEffectType'][] = ['auto', 'sakura', 'fireflies', 'leaves', 'snow'];
    const authorCardStyleOptions: FrontendSiteConfig['authorCardStyle'][] = ['detailed', 'minimal'];
    const recommendationModeOptions: FrontendSiteConfig['recommendationMode'][] = ['category', 'tag', 'date', 'random'];
    const effectModeOptions: AdminSystemConfig['activeEffectMode'][] = [
        'SNOW_FALL',
        'MATRIX_RAIN',
        'NEON_AMBIENT',
        'TERMINAL_GRID',
        'HEART_PARTICLES',
        'SCAN_LINES',
    ];

    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showMaintConfirm, setShowMaintConfirm] = useState(false);
    const [pendingMaintState, setPendingMaintState] = useState(false);
    const [maintCountdown, setMaintCountdown] = useState<number | null>(null);
    const [floatingEditor, setFloatingEditor] = useState<
        | null
        | { kind: 'nav'; id: string; field: 'label' | 'path' }
        | { kind: 'social'; id: string; field: 'platform' | 'url' }
    >(null);

    const faviconInputRef = useRef<HTMLInputElement>(null);
    const adminFaviconInputRef = useRef<HTMLInputElement>(null);
    const charInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
    const characterPreviewObjectUrlsRef = useRef<Record<string, string>>({});

    const revokeCharacterAvatarObjectUrls = useCallback(() => {
        for (const url of Object.values(characterPreviewObjectUrlsRef.current) as string[]) {
            try {
                URL.revokeObjectURL(url);
            } catch {
            }
        }
        characterPreviewObjectUrlsRef.current = {};
    }, []);

    const resetCharacterAvatarState = useCallback(() => {
        revokeCharacterAvatarObjectUrls();
        setCharacterAvatarPreviews({});
        setCharacterAvatarUploading({});
        setCharacterAvatarErrored({});
    }, [revokeCharacterAvatarObjectUrls]);

    const resolvePreviewUrl = (raw: string | undefined | null) => {
        const value = String(raw ?? '').trim();
        if (!value) return '';
        if (value.startsWith('blob:') || value.startsWith('data:')) return value;
        if (typeof window === 'undefined') return value;
        try {
            return new URL(value, window.location.origin).toString();
        } catch {
            return value;
        }
    };

    useEffect(() => {
        return () => {
            revokeCharacterAvatarObjectUrls();
        };
    }, [revokeCharacterAvatarObjectUrls]);

    useEffect(() => {
        if (isEditing) return;
        const next = toUiFromConfig(config);
        setFrontend(next.frontend);
        setBackend(next.backend);
        resetCharacterAvatarState();
    }, [config, isEditing, resetCharacterAvatarState]);

    const cancelEditing = () => {
        const next = toUiFromConfig(config);
        setFrontend(next.frontend);
        setBackend(next.backend);
        resetCharacterAvatarState();
        setIsEditing(false);
    };

    const triggerSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setShowSaveConfirm(false);
        try {
            const nextConfig = buildNextConfig(config, frontend, backend);
            const updated = await onUpdate(nextConfig);
            if (!updated) throw new Error('SAVE_DRAFT_FAILED');
            const next = toUiFromConfig(updated);
            setFrontend(next.frontend);
            setBackend(next.backend);
            toast.success(canUseDevPreview ? '草稿已保存（前台未同步）' : '草稿已保存');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '保存失败'));
        } finally {
            setIsSaving(false);
        }
    };

    const triggerPublish = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setShowPublishConfirm(false);
        try {
            const nextConfig = buildNextConfig(config, frontend, backend);
            const updated = await onPublish(nextConfig);
            if (!updated) throw new Error('PUBLISH_FAILED');
            const next = toUiFromConfig(updated);
            setFrontend(next.frontend);
            setBackend(next.backend);
            setIsEditing(false);
            toast.success('已发布（需重新部署三端后生效）');

            if (canUseDevPreview) {
                try {
                    const result = await onPreviewAll(updated);
                    if (result?.frontendSiteConfigPath) {
                        toast.success(`前台预览已同步：${result.frontendSiteConfigPath}`);
                    }
                } catch (err: unknown) {
                    toast.error(getErrorMessage(err, '前台预览同步失败'));
                }
            }
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '发布失败'));
        } finally {
            setIsSaving(false);
        }
    };

    const triggerThemePreview = async () => {
        if (!canUseDevPreview) return;
        if (isSaving) return;
        setIsSaving(true);
        try {
            const nextConfig = buildNextConfig(config, frontend, backend);
            const themes: ThemesConfig = { ...nextConfig.frontend.themes };
            if (themes.overrides == null) delete themes.overrides;
            const payload = {
                themes,
                enableSeasonEffect: nextConfig.frontend.enableSeasonEffect,
                seasonEffectType: nextConfig.frontend.seasonEffectType,
                seasonEffectIntensity: nextConfig.frontend.seasonEffectIntensity,
                enableAnniversaryEffect: nextConfig.frontend.enableAnniversaryEffect,
            } as const;
            const result = await onPreviewTheme(payload);
            toast.success(`预览导出成功：${result?.path ?? ''}`.trim());
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '预览失败'));
        } finally {
            setIsSaving(false);
        }
    };

    const triggerGlobalPreview = async () => {
        if (!canUseDevPreview) return;
        if (isSaving) return;
        setIsSaving(true);
        try {
            const nextConfig = buildNextConfig(config, frontend, backend);
            const updated = await onUpdate(nextConfig);
            if (!updated) throw new Error('SAVE_DRAFT_FAILED');
            const next = toUiFromConfig(updated);
            setFrontend(next.frontend);
            setBackend(next.backend);

            const result = await onPreviewAll(updated);
            toast.success(`草稿已保存并同步前台预览：${result?.frontendSiteConfigPath ?? ''}`.trim());
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '全局预览失败'));
        } finally {
            setIsSaving(false);
        }
    };

    const maintenanceFormValid = (draft = frontend.maintenance) => {
        const startAt = String(draft?.startAt ?? '').trim();
        const endAt = String(draft?.endAt ?? '').trim();
        const reason = String(draft?.reason ?? '').trim();
        if (!startAt || !endAt || !reason) return false;
        if (endAt < startAt) return false;
        return true;
    };

    const applyMaintenanceMode = useCallback(async (enable: boolean) => {
        setShowMaintConfirm(false);
        setMaintCountdown(null);

        const nextBackend = { ...backend, maintenanceMode: enable };
        const nextFrontend = { ...frontend, siteMode: enable ? 'maintenance' : 'normal' };
        setBackend(nextBackend);
        setFrontend(nextFrontend);

        if (isSaving) return;
        setIsSaving(true);
        try {
            const nextConfig = buildNextConfig(config, nextFrontend, nextBackend);
            const updated = await onUpdate(nextConfig);
            if (!updated) throw new Error('UPDATE_MAINTENANCE_FAILED');
            const next = toUiFromConfig(updated);
            setFrontend(next.frontend);
            setBackend(next.backend);
            toast.success(enable ? '已开启维护模式' : '已关闭维护模式');

            if (canUseDevPreview) {
                try {
                    const result = await onPreviewAll(updated);
                    if (result?.frontendSiteConfigPath) {
                        toast.success(`前台预览已同步：${result.frontendSiteConfigPath}`);
                    }
                } catch (err: unknown) {
                    toast.error(getErrorMessage(err, '前台预览同步失败'));
                }
            }
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '更新失败'));
        } finally {
            setIsSaving(false);
        }
    }, [backend, canUseDevPreview, config, frontend, isSaving, onPreviewAll, onUpdate, toast]);

    useEffect(() => {
        if (maintCountdown === null) return;
        if (maintCountdown <= 0) {
            setMaintCountdown(null);
            applyMaintenanceMode(true);
            return;
        }
        const id = window.setTimeout(() => {
            setMaintCountdown(prev => (prev === null ? null : prev - 1));
        }, 1000);
        return () => window.clearTimeout(id);
    }, [applyMaintenanceMode, maintCountdown]);

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await onUploadFavicon(file);
            setFrontend({ ...frontend, faviconUrl: url });
            toast.success('Favicon 上传成功');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, 'Favicon 上传失败'));
        } finally {
            if (faviconInputRef.current) faviconInputRef.current.value = '';
        }
    };

    const handleAdminFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await onUploadFavicon(file);
            setBackend({ ...backend, adminFavicon: url });
            toast.success('后台图标上传成功');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '后台图标上传失败'));
        } finally {
            if (adminFaviconInputRef.current) adminFaviconInputRef.current.value = '';
        }
    };

    const handleCharAvatarUpload = async (charId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);
        const previousUrl = characterPreviewObjectUrlsRef.current[charId];
        if (previousUrl && previousUrl !== previewUrl) {
            try {
                URL.revokeObjectURL(previousUrl);
            } catch {
            }
        }
        characterPreviewObjectUrlsRef.current[charId] = previewUrl;
        setCharacterAvatarPreviews(prev => ({ ...prev, [charId]: previewUrl }));
        setCharacterAvatarUploading(prev => ({ ...prev, [charId]: true }));
        setCharacterAvatarErrored(prev => ({ ...prev, [charId]: false }));

        try {
            const url = await onUploadCharacterAvatar(file);
            setCharacterAvatarPreviews(prev => {
                if (!(charId in prev)) return prev;
                const next = { ...prev };
                delete next[charId];
                return next;
            });
            setCharacterAvatarErrored(prev => ({ ...prev, [charId]: false }));
            const createdUrl = characterPreviewObjectUrlsRef.current[charId];
            if (createdUrl) {
                try {
                    URL.revokeObjectURL(createdUrl);
                } catch {
                }
                delete characterPreviewObjectUrlsRef.current[charId];
            }
            setFrontend({
                ...frontend,
                activeCharacters: frontend.activeCharacters.map(c =>
                    c.id === charId ? { ...c, avatar: url } : c
                ),
            });
            toast.success('角色头像上传成功');
        } catch (err: unknown) {
            toast.error(getErrorMessage(err, '角色头像上传失败'));
        } finally {
            setCharacterAvatarUploading(prev => ({ ...prev, [charId]: false }));
            const input = charInputRefs.current[charId];
            if (input) input.value = '';
        }
    };

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
        const objectUrl = characterPreviewObjectUrlsRef.current[id];
        if (objectUrl) {
            try {
                URL.revokeObjectURL(objectUrl);
            } catch {
            }
            delete characterPreviewObjectUrlsRef.current[id];
        }
        setCharacterAvatarPreviews(prev => {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setCharacterAvatarUploading(prev => {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setCharacterAvatarErrored(prev => {
            if (!(id in prev)) return prev;
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setFrontend({...frontend, activeCharacters: frontend.activeCharacters.filter(c => c.id !== id)});
    };

    const updateCharacter = (id: string, field: keyof CharacterConfig, value: CharacterConfig[keyof CharacterConfig]) => {
        setFrontend({
            ...frontend,
            activeCharacters: frontend.activeCharacters.map(c => 
                c.id === id ? { ...c, [field]: value } : c
            )
        });
    };

    const handleAddNav = () => {
        const newNav: NavLinkConfig = { id: Date.now().toString(), label: '新链接', path: '/', enableExternal: false, visible: true };
        setFrontend({...frontend, navLinks: [...frontend.navLinks, newNav]});
    };
    const updateNav = (id: string, field: keyof NavLinkConfig, value: NavLinkConfig[keyof NavLinkConfig]) => {
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
    const updateSocial = (id: string, field: keyof SocialLinkConfig, value: SocialLinkConfig[keyof SocialLinkConfig]) => {
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
            
            <div className="flex items-center justify-between bg-surface2/60 p-4 rounded-2xl border border-border backdrop-blur-sm sticky top-2 z-20 shadow-lg mx-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Settings2 size={20} /></div>
                    <h3 className="text-lg font-semibold text-fg">应用全域配置</h3>
                </div>
                
                <div className="flex items-center gap-4">
                    
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors
                        ${isEditing ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-fg/5 border-border text-muted'}
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
                             <NeonButton variant="ghost" onClick={cancelEditing}>取消</NeonButton>
                             <NeonButton variant="primary" onClick={() => setShowSaveConfirm(true)} icon={isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>}>
                                 {isSaving ? '保存中...' : '保存草稿'}
                             </NeonButton>
                              {canUseDevPreview && (
                                  <NeonButton variant="secondary" disabled={isSaving} onClick={triggerGlobalPreview} icon={<RefreshCw size={16} className={isSaving ? 'animate-spin' : ''} />}>
                                      同步预览
                                  </NeonButton>
                              )}
                              <NeonButton variant="secondary" disabled={isSaving} onClick={() => setShowPublishConfirm(true)} icon={<Upload size={16}/>}>
                                  发布
                              </NeonButton>
                           </div>
                      )}
                  </div>
              </div>

            
            <div className="space-y-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Globe className="text-primary" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-tight">前台配置</h2>
                </div>

                <div className="flex flex-col gap-8">
                    
                    <GlassCard className="w-full">
                        <SectionTitle icon={Globe} title="SEO 元信息配置" />
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CyberInput label="站点名称" value={frontend.siteName} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteName: e.target.value})} />
                                <CyberInput label="站点地址" value={frontend.siteUrl} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteUrl: e.target.value})} />
                                
                                <div className="md:col-span-2 flex items-center gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                    <div 
                                        onClick={() => isEditing && faviconInputRef.current?.click()}
                                        className={`relative w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group hover:border-primary/50 transition-colors shadow-md
                                        ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        {frontend.faviconUrl ? (
                                            <img src={frontend.faviconUrl} alt="Favicon" className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Globe size={24} className="text-muted" />
                                        )}
                                        {isEditing && (
                                             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                        )}
                                        <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={handleFaviconUpload} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <label className="block text-sm font-medium text-muted mb-2 ml-1">
                                            网站图标源
                                        </label>
                                        <div className="relative">
                                             <input 
                                                className={`w-full bg-surface text-fg border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted text-base
                                                ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                                value={frontend.faviconUrl}
                                                onChange={(e) => setFrontend({...frontend, faviconUrl: e.target.value})}
                                                disabled={!isEditing}
                                                placeholder="https://... 或点击左侧上传"
                                             />
                                        </div>
                                    <p className="text-sm text-muted mt-2">支持 .ico, .png, .svg 格式</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <CyberInput label="SEO 标题" value={frontend.siteTitle} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteTitle: e.target.value})} />
                                <CyberInput label="SEO 作者" value={frontend.siteAuthor} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteAuthor: e.target.value})} />
                            </div>
                            <CyberInput label="SEO 描述" value={frontend.siteDescription} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteDescription: e.target.value})} />
                            <CyberInput label="SEO 关键词" value={frontend.siteKeywords} disabled={!isEditing} onChange={e => setFrontend({...frontend, siteKeywords: e.target.value})} />
                            <CyberInput label="社交卡片头像（本地路径）" value={frontend.socialCardAvatarImage} disabled={!isEditing} onChange={e => setFrontend({...frontend, socialCardAvatarImage: e.target.value})} />
                        </div>
                    </GlassCard>

                    
                    <GlassCard className="w-full">
                        <SectionTitle icon={Palette} title="主题与外观设置" />
                        {canUseDevPreview && (
                            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                <div className="text-sm text-muted leading-relaxed">
                                    <span className="font-semibold text-fg">开发预览</span>
                                    <span className="ml-2">仅临时导出主题/季节特效到前台配置文件，用于本地实时查看；生产环境不会出现此功能。</span>
                                </div>
                                <NeonButton
                                    variant="secondary"
                                    disabled={!isEditing || isSaving}
                                    onClick={triggerThemePreview}
                                    icon={<RefreshCw size={14} className={isSaving ? 'animate-spin' : ''} />}
                                >
                                    实时预览
                                </NeonButton>
                            </div>
                        )}
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-muted">主题模式</label>
                                <select 
                                    className={`w-full bg-surface text-fg border border-border rounded-xl px-4 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${!isEditing && 'opacity-60 cursor-not-allowed bg-fg/2'}`}
                                    value={frontend.themeMode}
                                    disabled={!isEditing}
                                    onChange={e => {
                                        const next = e.target.value as FrontendSiteConfig['themeMode'];
                                        if (next === 'single' || next === 'day-night' || next === 'select') {
                                            setFrontend({ ...frontend, themeMode: next });
                                        }
                                    }}
                                >
                                    <option value="single">单主题模式</option>
                                    <option value="day-night">日夜切换模式</option>
                                    <option value="select">主题选择模式</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">
                                        {frontend.themeMode === 'day-night' ? "日间主题" : "默认主题"}
                                    </label>
                                    <select 
                                        className={`w-full bg-surface text-fg border border-border rounded-xl px-4 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                        value={frontend.themeDefault}
                                        disabled={!isEditing}
                                        onChange={e => setFrontend({...frontend, themeDefault: e.target.value})}
                                    >
                                        {ensureThemeOption(
                                            frontend.themeMode === 'day-night' ? DAY_THEME_OPTIONS : ALL_THEME_OPTIONS,
                                            frontend.themeDefault
                                        ).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                
                                {frontend.themeMode === 'day-night' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2 ml-1">夜间主题</label>
                                        <select 
                                            className={`w-full bg-surface text-fg border border-border rounded-xl px-4 py-3.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                            value={frontend.themeDark}
                                            disabled={!isEditing}
                                            onChange={e => setFrontend({...frontend, themeDark: e.target.value})}
                                        >
                                            {ensureThemeOption(NIGHT_THEME_OPTIONS, frontend.themeDark).map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {frontend.themeMode === 'select' && (
                                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div className="text-sm text-slate-400">
                                            可选主题数量：{Array.isArray(frontend.themeInclude) ? frontend.themeInclude.length : 0}
                                        </div>
                                        <NeonButton
                                            variant="secondary"
                                            disabled={!isEditing}
                                            onClick={() => setFrontend({ ...frontend, themeInclude: normalizeList(ALL_BUILTIN_THEMES) })}
                                        >
                                            恢复默认主题列表（全部）
                                        </NeonButton>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                  <Toggle 
                                     label="启用季节特效" 
                                     subLabel="如樱花飘落、雪花等前景装饰动画"
                                     checked={frontend.enableSeasonEffect} 
                                     disabled={!isEditing}
                                     onChange={(v: boolean) => setFrontend({
                                         ...frontend,
                                         enableSeasonEffect: v,
                                         ...(!v ? { enableAnniversaryEffect: false } : {}),
                                         ...(v && (!frontend.seasonEffectType || frontend.seasonEffectType === 'none')
                                             ? { seasonEffectType: 'auto' }
                                             : {}),
                                         ...(v && (!Number.isFinite(Number(frontend.seasonEffectIntensity)) || Number(frontend.seasonEffectIntensity) <= 0)
                                             ? { seasonEffectIntensity: 0.6 }
                                             : {}),
                                      })} 
                                  />
                                  {frontend.enableSeasonEffect && (
                                      <>
                                      <div className="mt-4 grid grid-cols-6 gap-2">
                                          {seasonEffectOptions.map(effect => (
                                              <button 
                                                 key={effect}
                                                 disabled={!isEditing}
                                                 onClick={() => setFrontend({...frontend, seasonEffectType: effect})}
                                                className={`
                                                    py-2.5 rounded-lg text-sm font-medium border transition-all
                                                    ${frontend.seasonEffectType === effect ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-500 hover:bg-white/5'}
                                                    ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                                 `}
                                              >
                                                  {effect === 'auto' ? '自动' :
                                                   effect === 'sakura' ? '樱花' : 
                                                   effect === 'fireflies' ? '萤火虫' :
                                                   effect === 'snow' ? '飞雪' : 
                                                   '落叶'}
                                              </button>
                                          ))}
                                      </div>
                                      <div className="mt-4">
                                          <Toggle
                                              label="纪念日彩蛋（1月22日）"
                                              subLabel="仅在 1 月 22 日（系统时区）生效：当天将暂停季节特效并替换为纪念日特效"
                                              checked={frontend.enableAnniversaryEffect}
                                              disabled={!isEditing || !frontend.enableSeasonEffect}
                                              onChange={(v: boolean) => setFrontend({ ...frontend, enableAnniversaryEffect: v })}
                                              color="text-accent"
                                          />
                                      </div>
                                      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                          <div className="flex items-center justify-between text-sm text-slate-400">
                                              <span>特效强度</span>
                                              <span className="font-mono text-slate-300">{Math.round((frontend.seasonEffectIntensity ?? 0) * 100)}%</span>
                                          </div>
                                          <input
                                              type="range"
                                              min={0.1}
                                              max={1}
                                              step={0.02}
                                              value={frontend.seasonEffectIntensity}
                                              disabled={!isEditing}
                                              onChange={e => setFrontend({ ...frontend, seasonEffectIntensity: parseFloat(e.target.value) })}
                                              className={`
                                                  w-full h-4 bg-border/70 rounded-lg appearance-none mt-3
                                                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full
                                                  ${isEditing ? 'cursor-pointer hover:bg-fg/8' : 'cursor-not-allowed opacity-50'}
                                              `}
                                          />
                                      </div>
                                      </>
                                  )}
                             </div>
                        </div>
                    </GlassCard>

                    
                    <GlassCard className="w-full">
                        <SectionTitle icon={Layout} title="功能组件配置" badge="功能开关" />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            <div className="space-y-6">
                                
                                <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 ${!isEditing && 'opacity-80'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                            <UserCircle size={16} /> 作者名片
                                        </div>

                                    </div>

                                    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-slate-200 truncate">About 作者名片</div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <div
                                                    className="p-2 rounded-lg border border-white/10 bg-white/[0.02] text-slate-400"
                                                    title="该模块在 About 页强制启用"
                                                >
                                                    <Lock size={16} />
                                                </div>
                                                <HelpButton
                                                    title="作者名片说明"
                                                    disabled={false}
                                                    onClick={() => setHelpModalKey('authorCard')}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-3">
                                            {authorCardStyleOptions.map(style => (
                                                <button
                                                    key={style}
                                                    disabled={!isEditing}
                                                    onClick={() => setFrontend({ ...frontend, authorCardStyle: style })}
                                                    className={`
                                                        flex-1 py-1.5 text-sm rounded border transition-colors
                                                        ${frontend.authorCardStyle === style ? 'bg-primary/20 border-primary text-white' : 'border-white/10 text-slate-500 hover:text-slate-200'}
                                                        ${!isEditing && 'opacity-50 cursor-not-allowed'}
                                                    `}
                                                >
                                                    {style === 'minimal' ? '简单版' : '详细版'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <Toggle
                                        label="文末作者名片"
                                        subLabel="用于文章文末作者名片（Lite）"
                                        checked={frontend.enableFooterAuthorCard}
                                        disabled={!isEditing}
                                        onChange={(v: boolean) => setFrontend({ ...frontend, enableFooterAuthorCard: v })}
                                    />
                                </div>

                                
                                <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 ${!isEditing && 'opacity-80'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                            <FileText size={16} /> 分页设置
                                        </div>
                                        <HelpButton
                                            title="分页规则"
                                            disabled={false}
                                            onClick={() => setHelpModalKey('pagination')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm text-slate-500 uppercase">首页</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={19}
                                                disabled={!isEditing}
                                                className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                value={frontend.homePageSize}
                                                onChange={e => {
                                                    const v = Number.parseInt(e.target.value, 10);
                                                    if (!Number.isFinite(v)) return;
                                                    setFrontend({ ...frontend, homePageSize: Math.max(1, Math.min(19, v)) });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-500 uppercase">归档</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={19}
                                                disabled={!isEditing}
                                                className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                value={frontend.archivePageSize}
                                                onChange={e => {
                                                    const v = Number.parseInt(e.target.value, 10);
                                                    if (!Number.isFinite(v)) return;
                                                    setFrontend({ ...frontend, archivePageSize: Math.max(1, Math.min(19, v)) });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-500 uppercase">专栏</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={19}
                                                disabled={!isEditing}
                                                className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                value={frontend.categoryPageSize}
                                                onChange={e => {
                                                    const v = Number.parseInt(e.target.value, 10);
                                                    if (!Number.isFinite(v)) return;
                                                    setFrontend({ ...frontend, categoryPageSize: Math.max(1, Math.min(19, v)) });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm text-slate-500 uppercase">标签</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={19}
                                                disabled={!isEditing}
                                                className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                value={frontend.tagPageSize}
                                                onChange={e => {
                                                    const v = Number.parseInt(e.target.value, 10);
                                                    if (!Number.isFinite(v)) return;
                                                    setFrontend({ ...frontend, tagPageSize: Math.max(1, Math.min(19, v)) });
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                            
                            <div className="space-y-6">
                                
                                <div className={`p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 ${!isEditing && 'opacity-80'}`}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                            <Zap size={16} /> 文末推荐
                                        </div>
                                        <HelpButton
                                            title="文末推荐说明"
                                            disabled={false}
                                            onClick={() => setHelpModalKey('recommendations')}
                                        />
                                    </div>

                                    <Toggle
                                        label="启用文末推荐"
                                        subLabel="在文章详情页底部展示推荐文章"
                                        checked={frontend.enableRecommendations}
                                        disabled={!isEditing}
                                        onChange={(v: boolean) => setFrontend({ ...frontend, enableRecommendations: v })}
                                    />

                                    {frontend.enableRecommendations && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm text-slate-500 uppercase">推荐方向</label>
                                                <select
                                                    disabled={!isEditing}
                                                    className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                    value={frontend.recommendationMode}
                                                    onChange={e => {
                                                        const next = e.target.value as FrontendSiteConfig['recommendationMode'];
                                                        if (recommendationModeOptions.includes(next)) {
                                                            setFrontend({ ...frontend, recommendationMode: next });
                                                        }
                                                    }}
                                                >
                                                    <option value="category">按专栏</option>
                                                    <option value="tag">按标签</option>
                                                    <option value="date">按日期</option>
                                                    <option value="random">随机</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-sm text-slate-500 uppercase">数量</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={19}
                                                    disabled={!isEditing}
                                                    className="w-full bg-surface text-fg text-base border border-border rounded-xl p-3 mt-1 disabled:opacity-50"
                                                    value={frontend.recommendationCount}
                                                    onChange={e => {
                                                        const v = Number.parseInt(e.target.value, 10);
                                                        if (!Number.isFinite(v)) return;
                                                        setFrontend({ ...frontend, recommendationCount: Math.max(1, Math.min(19, v)) });
                                                    }}
                                                    title="范围：1-19"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                
                                <div className={`p-5 rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 flex flex-col h-full ${!isEditing ? 'opacity-80' : ''}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                                        <Users size={16} /> 角色对话组件
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <Toggle
                                        label="启用角色对话"
                                        subLabel="用于 markdown 内的轻量角色段落（建议少量使用）"
                                        checked={frontend.enableCharacters}
                                        disabled={!isEditing}
                                        onChange={(v: boolean) => setFrontend({ ...frontend, enableCharacters: v })}
                                    />
                                </div>

                                {frontend.enableCharacters && (
                                    <div className="flex-1 flex flex-col min-h-[300px]">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm text-slate-500 uppercase">活跃角色列表</label>
                                            <button 
                                                disabled={!isEditing} 
                                                onClick={addCharacter}
                                                className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={12} /> 添加角色
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3 overflow-y-auto overflow-x-hidden max-h-[440px] pr-1 custom-scrollbar">
                                            {frontend.activeCharacters.map((char) => (
                                                <div key={char.id} className="p-3 bg-surface border border-border rounded-xl flex items-center gap-3 group hover:border-fg/20 transition-colors min-w-0">
                                                    <div
                                                        className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer relative ${isEditing ? 'hover:border-primary/50' : ''}`}
                                                        onClick={() => isEditing && charInputRefs.current[char.id]?.click()}
                                                        title={isEditing ? '上传 webp 头像' : undefined}
                                                    >
                                                        {(characterAvatarPreviews[char.id] || char.avatar) && !characterAvatarErrored[char.id] ? (
                                                            <img
                                                                src={resolvePreviewUrl(characterAvatarPreviews[char.id] || char.avatar)}
                                                                alt={char.name}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                                onLoad={() => setCharacterAvatarErrored(prev => ({ ...prev, [char.id]: false }))}
                                                                onError={() => setCharacterAvatarErrored(prev => ({ ...prev, [char.id]: true }))}
                                                            />
                                                        ) : (
                                                            <span className="text-base font-bold text-slate-500">{(char.name || 'R').charAt(0)}</span>
                                                        )}
                                                        {isEditing && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {characterAvatarUploading[char.id] ? (
                                                                    <RefreshCw size={16} className="text-white animate-spin" />
                                                                ) : (
                                                                    <Upload size={16} className="text-white" />
                                                                )}
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/webp,image/*"
                                                            ref={(el) => { charInputRefs.current[char.id] = el; }}
                                                            onChange={(e) => handleCharAvatarUpload(char.id, e)}
                                                        />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <input
                                                            type="text"
                                                            className="w-full bg-transparent text-sm text-white font-medium focus:outline-none border-b border-transparent focus:border-primary placeholder-slate-600 pb-1"
                                                            value={char.name}
                                                            placeholder="角色名称（用于 markdown 指令）"
                                                            disabled={!isEditing}
                                                            onChange={(e) => updateCharacter(char.id, 'name', e.target.value)}
                                                        />
                                                    </div>

                                                    <button
                                                        disabled={!isEditing}
                                                        onClick={() => removeCharacter(char.id)}
                                                        className="shrink-0 p-2 rounded-lg border border-border bg-surface2/30 text-muted hover:text-danger hover:border-danger/30 hover:bg-danger/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="删除角色"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {frontend.activeCharacters.length === 0 && (
                                                <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-white/10 rounded-xl">
                                                    暂无角色，请点击右上角“添加角色”
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    </GlassCard>

                    
                    <GlassCard className="w-full">
                          <SectionTitle icon={LinkIcon} title="导航菜单与社交链接" />
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              
                              <div className={!isEditing ? 'pointer-events-none opacity-80' : ''}>
                                  <div className="flex justify-between items-center mb-4">
                                      <h4 className="text-sm font-bold text-slate-400 uppercase">导航菜单管理</h4>
                                      <button disabled={!isEditing} onClick={handleAddNav} className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50"><Plus size={14}/></button>
                                  </div>
                                  <div className="space-y-3">
                                      {frontend.navLinks.map((nav, idx) => (
                                          <div key={nav.id} className="flex gap-3 items-center bg-surface p-3 rounded-xl border border-border hover:border-fg/20 transition-colors overflow-hidden">
                                              <span className="text-xs font-mono text-slate-600 w-6 shrink-0 text-center">{idx + 1}</span>
                                              <input
                                                  disabled={!isEditing}
                                                  className="bg-transparent text-sm text-white border-b border-transparent focus:border-primary w-24 sm:w-32 outline-none disabled:opacity-50 shrink-0 placeholder-slate-700 transition-all"
                                                  value={nav.label}
                                                  placeholder="标题"
                                                  onChange={e => updateNav(nav.id, 'label', e.target.value)}
                                              />
                                              <div className="relative flex-1 min-w-0">
                                                  <input
                                                      disabled={!isEditing}
                                                      className="w-full bg-transparent text-sm text-slate-400 border-b border-transparent focus:border-primary outline-none font-mono disabled:opacity-50 placeholder-slate-700 transition-all pr-9 whitespace-nowrap overflow-hidden text-ellipsis"
                                                      value={nav.path}
                                                      placeholder="路由 / URL"
                                                      onChange={e => updateNav(nav.id, 'path', e.target.value)}
                                                  />
                                                  <button
                                                      type="button"
                                                      disabled={!isEditing}
                                                      onClick={() => setFloatingEditor({ kind: 'nav', id: nav.id, field: 'path' })}
                                                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-50"
                                                      title="展开编辑"
                                                  >
                                                      <Maximize2 size={14} />
                                                  </button>
                                              </div>
                                              <InlineSwitch
                                                  checked={nav.enableExternal}
                                                  disabled={!isEditing}
                                                  onChange={(next) => updateNav(nav.id, 'enableExternal', next)}
                                                  title="外链：新窗口打开"
                                              />
                                              <button
                                                  disabled={!isEditing}
                                                  onClick={() => removeNav(nav.id)}
                                                  className="text-muted hover:text-danger disabled:opacity-50 shrink-0 p-2 rounded-lg hover:bg-danger/10 transition-colors"
                                                  title="删除"
                                              >
                                                  <Trash2 size={16} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                              
                              
                              <div className={!isEditing ? 'pointer-events-none opacity-80' : ''}>
                                  <div className="flex justify-between items-center mb-4">
                                      <h4 className="text-sm font-bold text-slate-400 uppercase">社交联系方式</h4>
                                      <button disabled={!isEditing} onClick={handleAddSocial} className="p-1 rounded bg-secondary/10 text-secondary hover:bg-secondary/20 disabled:opacity-50"><Plus size={14}/></button>
                                  </div>
                                  <div className="space-y-3">
                                      {frontend.socialLinks.map((social) => (
                                          <div key={social.id} className="flex gap-3 items-center bg-surface p-3 rounded-xl border border-border hover:border-fg/20 transition-colors overflow-hidden">
                                              <input 
                                                  disabled={!isEditing} 
                                                  className="bg-transparent text-sm text-white border-b border-transparent focus:border-secondary w-24 sm:w-32 outline-none disabled:opacity-50 shrink-0 placeholder-slate-700 transition-all" 
                                                  value={social.platform} 
                                                  placeholder="平台"
                                                  onChange={e => updateSocial(social.id, 'platform', e.target.value)} 
                                              />
                                              <div className="relative flex-1 min-w-0">
                                                  <input 
                                                      disabled={!isEditing} 
                                                      className="w-full bg-transparent text-sm text-slate-400 border-b border-transparent focus:border-secondary outline-none font-mono disabled:opacity-50 placeholder-slate-700 transition-all pr-9 whitespace-nowrap overflow-hidden text-ellipsis" 
                                                      value={social.url} 
                                                      placeholder="URL"
                                                      onChange={e => updateSocial(social.id, 'url', e.target.value)} 
                                                  />
                                                  <button
                                                      type="button"
                                                      disabled={!isEditing}
                                                      onClick={() => setFloatingEditor({ kind: 'social', id: social.id, field: 'url' })}
                                                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-50"
                                                      title="展开编辑"
                                                  >
                                                      <Maximize2 size={14} />
                                                  </button>
                                              </div>
                                              <button 
                                                  disabled={!isEditing} 
                                                  onClick={() => removeSocial(social.id)} 
                                                  className="text-muted hover:text-danger disabled:opacity-50 shrink-0 p-2 rounded-lg hover:bg-danger/10 transition-colors"
                                                  title="删除"
                                              >
                                                  <Trash2 size={16}/>
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                    </GlassCard>

                    
                    <GlassCard className="w-full">
                        <div className="flex items-center gap-3 mb-6 text-muted border-b border-border pb-4">
                            <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary border border-border">
                                <Power size={18} />
                            </div>
                            <h3 className="text-base font-bold uppercase tracking-wider text-slate-300">维护模式</h3>
                            {frontend.siteMode === 'maintenance' && (
                                <span className="ml-1 text-xs px-2 py-0.5 rounded border border-warning/40 text-warning bg-warning/10">
                                    ON
                                </span>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                <HelpButton title="维护模式说明" onClick={() => setHelpModalKey('maintenance')} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Toggle
                                label="前台维护模式"
                                subLabel="开启后：所有前台路由重定向到维护页面"
                                checked={frontend.siteMode === 'maintenance'}
                                disabled={!isEditing}
                                onChange={(next: boolean) => {
                                    if (!isEditing) return;
                                    setPendingMaintState(next);
                                    setMaintCountdown(null);
                                    setShowMaintConfirm(true);
                                }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CyberInput
                                    label="开始"
                                    type="datetime-local"
                                    value={frontend.maintenance.startAt}
                                    disabled={!isEditing}
                                    onChange={e => setFrontend({ ...frontend, maintenance: { ...frontend.maintenance, startAt: e.target.value } })}
                                />
                                <CyberInput
                                    label="结束"
                                    type="datetime-local"
                                    value={frontend.maintenance.endAt}
                                    disabled={!isEditing}
                                    onChange={e => setFrontend({ ...frontend, maintenance: { ...frontend.maintenance, endAt: e.target.value } })}
                                />
                            </div>

                            <div className="group">
                                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
                                    原因
                                </label>
                                <textarea
                                    disabled={!isEditing}
                                    value={frontend.maintenance.reason}
                                    onChange={e => setFrontend({ ...frontend, maintenance: { ...frontend.maintenance, reason: e.target.value } })}
                                    placeholder="简短说明（用于维护页展示）"
                                    rows={3}
                                    className="w-full bg-surface text-fg text-base border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-fg/2 resize-y"
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            
            <div className="space-y-8 border-t border-white/10 pt-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <Server className="text-secondary" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-tight">后台配置</h2>
                </div>

                <div className="flex flex-col gap-8">
                    
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
                                     <div className="md:col-span-2 flex items-center gap-5 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                                         <div
                                             onClick={() => isEditing && adminFaviconInputRef.current?.click()}
                                             className={`relative w-16 h-16 rounded-xl bg-surface border border-border flex items-center justify-center cursor-pointer overflow-hidden shrink-0 group hover:border-primary/50 transition-colors shadow-md
                                             ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}`}
                                         >
                                             {backend.adminFavicon ? (
                                                 <img src={backend.adminFavicon} alt="Admin Favicon" className="w-8 h-8 object-contain" />
                                             ) : (
                                                 <Monitor size={24} className="text-muted" />
                                             )}
                                             {isEditing && (
                                                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                     <Camera size={16} className="text-white" />
                                                 </div>
                                             )}
                                             <input type="file" ref={adminFaviconInputRef} className="hidden" accept="image/*" onChange={handleAdminFaviconUpload} />
                                         </div>

                                         <div className="flex-1 min-w-0">
                                             <label className="block text-sm font-medium text-muted mb-2 ml-1">
                                                 后台图标
                                             </label>
                                             <div className="relative">
                                                 <input
                                                     className={`w-full bg-surface text-fg border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted text-base
                                                     ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                                     value={backend.adminFavicon}
                                                     onChange={(e) => setBackend({ ...backend, adminFavicon: e.target.value })}
                                                     disabled={!isEditing}
                                                     placeholder="https://... 或点击左侧上传"
                                                 />
                                             </div>
                                             <p className="text-sm text-muted mt-2">支持 .ico, .png, .svg 格式</p>
                                         </div>
                                     </div>
                                 </div>
                             )}
                             {backend.enableEnhancedSeo && (
                                 <CyberInput
                                     label="后台描述"
                                     value={backend.adminDescription}
                                     disabled={!isEditing}
                                     onChange={e => setBackend({ ...backend, adminDescription: e.target.value })}
                                 />
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
                                            className={`w-full bg-surface text-accent border border-border rounded-xl px-4 py-3 text-base ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                                            value={backend.activeEffectMode}
                                            disabled={!isEditing}
                                            onChange={e => {
                                                const next = e.target.value as AdminSystemConfig['activeEffectMode'];
                                                if (effectModeOptions.includes(next)) {
                                                    setBackend({ ...backend, activeEffectMode: next });
                                                }
                                            }}
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
                                                    w-full h-4 bg-border/70 rounded-lg appearance-none mt-2
                                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full
                                                    ${isEditing ? 'cursor-pointer hover:bg-fg/8' : 'cursor-not-allowed opacity-50'}
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
                                    options={[
                                        { value: 7, label: '7天' },
                                        { value: 15, label: '15天' },
                                        { value: 30, label: '30天' },
                                    ]}
                                 />
                                 <CyberInput 
                                    type="number"
                                    label="自动保存间隔 (秒)" 
                                    value={backend.autoSaveInterval} 
                                    disabled={!isEditing}
                                    onChange={e => setBackend({...backend, autoSaveInterval: parseInt(e.target.value)})} 
                                    options={[
                                        { value: 30, label: '0.5min (30s)' },
                                        { value: 60, label: '1min (60s)' },
                                        { value: 120, label: '2min (120s)' },
                                        { value: 360, label: '6min (360s)' },
                                    ]}
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
                              
                              {false && (
                              <div className="pt-4 border-t border-white/5">
                                  <div className={`
                                      p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300
                                      ${backend.maintenanceMode ? 'bg-danger/10 border-danger/30' : 'bg-surface/30 border-border'} 
                                      ${!isEditing && 'opacity-60'}
                                  `}>
                                     <div className="flex items-start gap-4">
                                         <div className={`p-3 rounded-full ${backend.maintenanceMode ? 'bg-danger text-fg' : 'bg-surface2 text-muted'}`}>
                                            <AlertTriangle size={24} />
                                         </div>
                                         <div>
                                             <span className={`text-base font-bold ${backend.maintenanceMode ? 'text-danger' : 'text-fg'}`}>后台维护模式</span>
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
                                                ? 'bg-danger text-fg border-danger hover:bg-danger/90' 
                                                : 'bg-transparent text-muted border-border hover:border-primary/40 hover:text-fg'}
                                            ${!isEditing ? 'cursor-not-allowed opacity-50' : ''}
                                        `}
                                     >
                                         {backend.maintenanceMode ? '关闭维护模式' : '开启维护模式'}
                                     </button>
                                  </div>
                              </div>
                              )}
                          </div>
                     </GlassCard>
                </div>
            </div>

            
            
            
            <ConfirmModal 
                isOpen={showSaveConfirm}
                onClose={() => setShowSaveConfirm(false)}
                onConfirm={triggerSave}
                title="保存配置确认"
                message="保存仅会写入草稿配置，不会对读者端立即生效；读者端需“发布 + 三端同步部署”后才会生效。"
                type="primary"
                confirmText="保存草稿"
            />

            
            <ConfirmModal 
                isOpen={showPublishConfirm}
                onClose={() => setShowPublishConfirm(false)}
                onConfirm={triggerPublish}
                title="发布配置确认"
                message="发布仅会更新“已发布配置”，需要配合前台/后台/服务端三端同步部署后才会对读者生效。"
                type="primary"
                confirmText="发布"
            />

            
            {showMaintConfirm && (
                <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    
                    <div
                        className="absolute inset-0"
                        onClick={() => {
                            if (maintCountdown !== null) return;
                            setShowMaintConfirm(false);
                            setMaintCountdown(null);
                        }}
                    />

                    <GlassCard className="max-w-2xl w-full relative overflow-hidden border-danger/25 shadow-lg" noPadding>
                        <div className="h-1 w-full bg-danger opacity-30" />
                        <div className="p-6">
                            <div className="flex items-start gap-5">
                                <div className="p-3 rounded-xl bg-danger/10 text-danger shrink-0 border border-danger/20">
                                    <AlertTriangle size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-lg font-bold text-danger">
                                            {pendingMaintState ? '开启维护模式' : '关闭维护模式'}
                                        </h3>
                                        <button
                                            type="button"
                                            disabled={maintCountdown !== null}
                                            onClick={() => {
                                                if (maintCountdown !== null) return;
                                                setShowMaintConfirm(false);
                                                setMaintCountdown(null);
                                            }}
                                            className="p-2 rounded-lg border border-white/10 bg-white/[0.02] text-slate-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="关闭"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    {pendingMaintState ? (
                                        <div className="mt-2 space-y-4">
                                            <div className="text-slate-300 text-sm leading-relaxed opacity-90">
                                                启用后所有前台路由将重定向到维护页面。
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <CyberInput
                                                    label="开始"
                                                    type="datetime-local"
                                                    value={frontend.maintenance.startAt}
                                                    disabled={!isEditing || isSaving || maintCountdown !== null}
                                                    onChange={e =>
                                                        setFrontend({
                                                            ...frontend,
                                                            maintenance: { ...frontend.maintenance, startAt: e.target.value },
                                                        })
                                                    }
                                                />
                                                <CyberInput
                                                    label="结束"
                                                    type="datetime-local"
                                                    value={frontend.maintenance.endAt}
                                                    disabled={!isEditing || isSaving || maintCountdown !== null}
                                                    onChange={e =>
                                                        setFrontend({
                                                            ...frontend,
                                                            maintenance: { ...frontend.maintenance, endAt: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>

                                            <div className="group">
                                                <label className="block text-sm font-medium text-slate-400 mb-2 ml-1 transition-colors group-focus-within:text-primary">
                                                    原因
                                                </label>
                                                <textarea
                                                    disabled={!isEditing || isSaving || maintCountdown !== null}
                                                    value={frontend.maintenance.reason}
                                                    onChange={e =>
                                                        setFrontend({
                                                            ...frontend,
                                                            maintenance: { ...frontend.maintenance, reason: e.target.value },
                                                        })
                                                    }
                                                    placeholder="简短说明（用于维护页展示）"
                                                    rows={3}
                                                    className="w-full bg-surface text-fg text-base border border-border rounded-xl px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-fg/2 resize-y"
                                                />
                                            </div>

                                            {maintCountdown !== null && (
                                                <div className="rounded-xl border border-danger/25 bg-danger/10 px-4 py-3 text-sm text-danger">
                                                    将在 <span className="font-bold text-danger">{maintCountdown}</span> 秒后进入维护模式…
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-3 pt-1">
                                                {maintCountdown === null ? (
                                                    <>
                                                        <NeonButton
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setShowMaintConfirm(false);
                                                                setMaintCountdown(null);
                                                            }}
                                                            disabled={isSaving}
                                                        >
                                                            取消
                                                        </NeonButton>
                                                        <NeonButton
                                                            variant="warning"
                                                            onClick={() => {
                                                                if (!maintenanceFormValid()) {
                                                                    toast.error('请先填写维护信息（开始/结束/原因）');
                                                                    return;
                                                                }
                                                                setMaintCountdown(10);
                                                            }}
                                                            disabled={isSaving || !maintenanceFormValid()}
                                                        >
                                                            确认（10s）
                                                        </NeonButton>
                                                        <NeonButton
                                                            variant="danger"
                                                            onClick={() => {
                                                                if (!maintenanceFormValid()) {
                                                                    toast.error('请先填写维护信息（开始/结束/原因）');
                                                                    return;
                                                                }
                                                                applyMaintenanceMode(true);
                                                            }}
                                                            disabled={isSaving || !maintenanceFormValid()}
                                                        >
                                                            立即启动
                                                        </NeonButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <NeonButton
                                                            variant="ghost"
                                                            onClick={() => setMaintCountdown(null)}
                                                            disabled={isSaving}
                                                        >
                                                            取消倒计时
                                                        </NeonButton>
                                                        <NeonButton
                                                            variant="danger"
                                                            onClick={() => applyMaintenanceMode(true)}
                                                            disabled={isSaving}
                                                        >
                                                            立即启动
                                                        </NeonButton>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 space-y-4">
                                            <div className="text-slate-300 text-sm leading-relaxed opacity-90">
                                                确认关闭维护模式？前台将恢复正常访问。
                                            </div>
                                            <div className="flex justify-end gap-3">
                                                <NeonButton
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setShowMaintConfirm(false);
                                                        setMaintCountdown(null);
                                                    }}
                                                    disabled={isSaving}
                                                >
                                                    取消
                                                </NeonButton>
                                                <NeonButton
                                                    variant="primary"
                                                    onClick={() => applyMaintenanceMode(false)}
                                                    disabled={isSaving}
                                                >
                                                    确认关闭
                                                </NeonButton>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            <FloatingTextEditorModal
                isOpen={floatingEditor !== null}
                onClose={() => setFloatingEditor(null)}
                title={
                    floatingEditor?.kind === 'nav'
                        ? '导航：路由 / URL'
                        : floatingEditor?.kind === 'social'
                            ? '社交：URL'
                            : '编辑'
                }
                value={(() => {
                    if (!floatingEditor) return '';
                    if (floatingEditor.kind === 'nav') {
                        const item = frontend.navLinks.find(x => x.id === floatingEditor.id);
                        return item ? (floatingEditor.field === 'label' ? item.label : item.path) : '';
                    }
                    const item = frontend.socialLinks.find(x => x.id === floatingEditor.id);
                    return item ? (floatingEditor.field === 'platform' ? item.platform : item.url) : '';
                })()}
                onChange={(next) => {
                    if (!floatingEditor) return;
                    if (floatingEditor.kind === 'nav') {
                        updateNav(floatingEditor.id, floatingEditor.field === 'label' ? 'label' : 'path', next);
                        return;
                    }
                    updateSocial(floatingEditor.id, floatingEditor.field === 'platform' ? 'platform' : 'url', next);
                }}
                placeholder="请输入…"
                disabled={!isEditing}
            />
 
            
            <ConfirmModal
                isOpen={helpModalKey !== null}
                onClose={() => setHelpModalKey(null)}
                onConfirm={() => setHelpModalKey(null)}
                title={
                    helpModalKey === 'authorCard'
                        ? '作者名片说明'
                        : helpModalKey === 'pagination'
                            ? '分页规则'
                            : helpModalKey === 'maintenance'
                                ? '维护模式说明'
                                : '文末推荐说明'
                }
                message={
                    helpModalKey === 'authorCard' ? (
                        <div className="space-y-2">
                            <div>About 作者名片始终启用，仅提供样式切换。</div>
                            <div>详细版：可点击进入作者详情页（当前为“正在装修中”占位页）。</div>
                            <div>简单版：仅展示，不提供跳转。</div>
                        </div>
                    ) : helpModalKey === 'pagination' ? (
                        <div className="space-y-2">
                            <div>默认分页数固定为 6（源码），不提供修改入口。</div>
                            <div>这里配置的是各页面覆盖值，范围为 1–19。</div>
                            <div>覆盖值优先生效。</div>
                        </div>
                    ) : helpModalKey === 'maintenance' ? (
                        <div className="space-y-2">
                            <div>开启后，所有前台路由会重定向到维护页面。</div>
                            <div>维护信息（开始/结束/原因）会展示在维护页面。</div>
                            <div>启动维护模式会自动写入草稿配置；生产环境仍需发布并部署前台生效。</div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div>开关控制文章底部是否展示推荐列表。</div>
                            <div>默认推荐数固定为 6（源码），不提供修改入口。</div>
                            <div>自定义推荐数范围为 1–19，自定义值优先生效。</div>
                        </div>
                    )
                }
                type="info"
                confirmText="知道了"
                cancelText="关闭"
            />
        </div>
    );
};
