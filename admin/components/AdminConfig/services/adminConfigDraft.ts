import type { SystemConfig } from '../../../types';
import type {
  AdminSystemConfig,
  AnalyticsConfig,
  DatabaseConfig,
  FrontendSiteConfig,
  LogConfig,
  OSSConfig,
  ServerRuntimeConfig,
  SocialLinkConfig,
  UserProfile,
} from '../types';

export type AdminConfigDraft = {
  version: 1;
  profile: UserProfile;
  system: {
    frontend: FrontendSiteConfig;
    backend: AdminSystemConfig;
  };
  infra: {
    db: DatabaseConfig;
    server: ServerRuntimeConfig;
    oss: OSSConfig;
    analytics: AnalyticsConfig;
    logs: LogConfig;
  };
};

const STORAGE_KEY = 'admin:admin-config-draft:v1';

const DEFAULT_PROFILE: UserProfile = {
  username: 'root_admin',
  displayName: 'Root Administrator',
  email: 'root@dracula.io',
  roleTitle: '系统架构师 (System Architect)',
  bio: '负责数字边界的开拓。维护系统完整性与自动化部署流水线。',
  emojiStatus: '🛡️',
  avatarUrl: '',
};

const DEFAULT_FRONTEND: FrontendSiteConfig = {
  siteName: "Karene's Blog",
  siteTitle: 'Karene | Digital Garden',
  siteDescription: 'A cyberpunk themed blog powered by MultiTerm.',
  siteKeywords: 'React, Astro, Cyberpunk, Tech',
  faviconUrl: '',
  themeMode: 'day-night',
  themeDefault: 'catppuccin-latte',
  themeDark: 'catppuccin-mocha',
  enableSeasonEffect: true,
  seasonEffectType: 'snow',
  enableGiscus: false,
  giscusRepo: '',
  giscusCategory: '',
  enableCharacters: true,
  activeCharacters: [
    { id: '1', name: 'Owl Bot', avatar: '', enable: true },
    { id: '2', name: 'Karene', avatar: '', enable: true },
  ],
  enableAuthorCard: true,
  authorCardStyle: 'detailed',
  pageSize: 6,
  enableRecommendations: true,
  recommendationMode: 'tag',
  navLinks: [
    { id: '1', label: '首页', path: '/', enableExternal: false, visible: true },
    { id: '2', label: '关于', path: '/about', enableExternal: false, visible: true },
    { id: '3', label: '归档', path: '/archive', enableExternal: false, visible: true },
    { id: '4', label: 'GitHub', path: 'https://github.com/yourname', enableExternal: true, visible: true },
  ],
  socialLinks: [
    { id: '1', platform: 'Github', url: 'https://github.com', visible: true },
    { id: '2', platform: 'Twitter', url: 'https://twitter.com', visible: true },
  ],
  siteMode: 'normal',
};

const DEFAULT_BACKEND: AdminSystemConfig = {
  enableEnhancedSeo: false,
  adminTitle: 'MultiTerm Admin',
  adminFavicon: '/admin-favicon.png',
  enableBgEffect: true,
  activeEffectMode: 'SNOW_FALL',
  effectIntensity: 0.8,
  recycleBinRetentionDays: 15,
  autoSaveInterval: 30,
  previewLoadCover: false,
  enableImgCompression: true,
  maintenanceMode: false,
};

const DEFAULT_INFRA: AdminConfigDraft['infra'] = {
  db: {
    host: 'mongo-cluster-01.internal',
    port: 27017,
    username: 'admin',
    dbname: 'multiterm_core',
    enableStatusCollection: true,
  },
  server: {
    port: 3000,
    enableSecurityFilter: true,
    enableGzip: true,
  },
  oss: {
    provider: 'oss',
    endpoint: 'oss-cn-hangzhou.aliyuncs.com',
    bucket: 'my-blog-assets',
    accessKey: 'LTxxxxxxxx',
    secretKey: 'xxxxxxxx',
    region: 'oss-cn-hangzhou',
    customDomain: 'https://cdn.example.com',
  },
  analytics: {
    tool: 'INTERNAL',
    apiEndpoint: '/api/v1/metrics',
  },
  logs: {
    storagePath: '/var/log/multiterm',
    retentionDays: 30,
    collectionInterval: 60,
  },
};

export const AdminConfigDraftService = {
  load(): AdminConfigDraft | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AdminConfigDraft;
      if (!parsed || parsed.version !== 1) return null;
      return parsed;
    } catch {
      return null;
    }
  },

  save(draft: AdminConfigDraft) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  },

  createDefault(): AdminConfigDraft {
    return {
      version: 1,
      profile: DEFAULT_PROFILE,
      system: { frontend: DEFAULT_FRONTEND, backend: DEFAULT_BACKEND },
      infra: DEFAULT_INFRA,
    };
  },

  mergeSystemConfig(draft: AdminConfigDraft, systemConfig: SystemConfig): AdminConfigDraft {
    const navLinks = (systemConfig.frontend.navLinks ?? []).map((link, index) => ({
      id: String(index + 1),
      label: link.name,
      path: link.url,
      enableExternal: !!link.external,
      visible: true,
    }));

    const socialLinks = Object.entries(systemConfig.frontend.socialLinks ?? {}).map(([platform, url], index) => ({
      id: String(index + 1),
      platform,
      url: String(url ?? ''),
      visible: true,
    })) satisfies SocialLinkConfig[];

    const backendNext: AdminSystemConfig = {
      ...draft.system.backend,
      maintenanceMode: systemConfig.admin.maintenanceMode,
      activeEffectMode: systemConfig.admin.activeEffectMode,
      recycleBinRetentionDays: systemConfig.admin.recycleBinRetentionDays,
      autoSaveInterval: systemConfig.admin.autoSaveInterval,
      adminTitle: systemConfig.admin.siteName,
    };

    const frontendNext: FrontendSiteConfig = {
      ...draft.system.frontend,
      siteName: systemConfig.frontend.title,
      siteTitle: systemConfig.frontend.title,
      siteDescription: systemConfig.frontend.description,
      faviconUrl: systemConfig.frontend.faviconUrl,
      pageSize: systemConfig.frontend.pageSize,
      navLinks: navLinks.length ? navLinks : draft.system.frontend.navLinks,
      socialLinks: socialLinks.length ? socialLinks : draft.system.frontend.socialLinks,
    };

    const infraNext: AdminConfigDraft['infra'] = {
      ...draft.infra,
      analytics: {
        ...draft.infra.analytics,
        tool:
          systemConfig.admin.statsTool === 'INTERNAL' || systemConfig.admin.statsTool === 'GA4' || systemConfig.admin.statsTool === 'UMAMI'
            ? systemConfig.admin.statsTool
            : draft.infra.analytics.tool,
        apiEndpoint: systemConfig.admin.statsApiEndpoint,
      },
      oss: {
        ...draft.infra.oss,
        provider: systemConfig.oss.provider,
        endpoint: systemConfig.oss.endpoint ?? '',
        bucket: systemConfig.oss.bucket ?? '',
        accessKey: systemConfig.oss.accessKey ?? '',
        secretKey: systemConfig.oss.secretKey ?? '',
        region: systemConfig.oss.region ?? '',
        customDomain: systemConfig.oss.customDomain ?? '',
      },
    };

    return {
      ...draft,
      system: { frontend: frontendNext, backend: backendNext },
      infra: infraNext,
    };
  },

  applyToSystemConfig(systemConfig: SystemConfig, draft: AdminConfigDraft): SystemConfig {
    const nextStatsTool =
      draft.infra.analytics.tool === 'INTERNAL' || draft.infra.analytics.tool === 'GA4' || draft.infra.analytics.tool === 'UMAMI'
        ? draft.infra.analytics.tool
        : systemConfig.admin.statsTool;

    const navLinks = (draft.system.frontend.navLinks ?? [])
      .filter(link => link.visible)
      .map(link => ({
        name: link.label,
        url: link.path,
        external: link.enableExternal ? true : undefined,
      }));

    const socialLinks = (draft.system.frontend.socialLinks ?? [])
      .filter(link => link.visible && link.url.trim())
      .reduce((acc, item) => {
        acc[item.platform] = item.url;
        return acc;
      }, {} as Record<string, string>);

    return {
      ...systemConfig,
      admin: {
        ...systemConfig.admin,
        maintenanceMode: draft.system.backend.maintenanceMode,
        activeEffectMode: draft.system.backend.activeEffectMode as any,
        recycleBinRetentionDays: draft.system.backend.recycleBinRetentionDays,
        autoSaveInterval: draft.system.backend.autoSaveInterval,
        statsTool: nextStatsTool as any,
        statsApiEndpoint: draft.infra.analytics.apiEndpoint ?? systemConfig.admin.statsApiEndpoint,
      },
      frontend: {
        ...systemConfig.frontend,
        title: draft.system.frontend.siteTitle,
        description: draft.system.frontend.siteDescription,
        faviconUrl: draft.system.frontend.faviconUrl || systemConfig.frontend.faviconUrl,
        pageSize: draft.system.frontend.pageSize,
        navLinks,
        socialLinks: socialLinks as any,
      },
      oss: {
        ...systemConfig.oss,
        provider: draft.infra.oss.provider as any,
        endpoint: draft.infra.oss.endpoint || undefined,
        bucket: draft.infra.oss.bucket || undefined,
        accessKey: draft.infra.oss.accessKey || undefined,
        secretKey: draft.infra.oss.secretKey || undefined,
        region: draft.infra.oss.region || undefined,
        customDomain: draft.infra.oss.customDomain || undefined,
      },
    };
  },
};

