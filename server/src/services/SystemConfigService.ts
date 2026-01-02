import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';
import type {
  AdminConfig,
  FrontendSiteConfig,
  NavLink,
  OssConfig,
  SocialLinks,
  SystemConfig,
} from '../interfaces/SystemConfig';
import { SystemConfigRepository } from '../repositories/SystemConfigRepository';
import { FrontendSiteConfigSyncService } from './FrontendSiteConfigSyncService';

const MASKED_SECRET = '******';

function normalizeList(values: string[]) {
  const trimmed = values.map(value => value.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
}

function normalizeNavLinks(links: NavLink[]) {
  return links
    .map(link => ({
      name: String(link.name ?? '').trim(),
      url: String(link.url ?? '').trim(),
      external: link.external ? true : undefined,
    }))
    .filter(link => link.name && link.url);
}

function normalizeSocialLinks(links: SocialLinks) {
  const result: SocialLinks = {};
  (Object.entries(links ?? {}) as Array<[keyof SocialLinks, string | undefined]>).forEach(
    ([key, value]) => {
      const next = String(value ?? '').trim();
      if (next) result[key] = next;
    }
  );
  return result;
}

function normalizeCharacters(characters: Record<string, string>) {
  const result: Record<string, string> = {};
  Object.entries(characters ?? {}).forEach(([key, value]) => {
    const name = String(key ?? '').trim();
    const path = String(value ?? '').trim();
    if (name && path) result[name] = path;
  });
  return result;
}

function normalizeAdminConfig(config: AdminConfig): AdminConfig {
  const fallbackFont = DEFAULT_SYSTEM_CONFIG.admin.font;
  const face = String(config.font?.face ?? fallbackFont.face).trim() || fallbackFont.face;
  const weight = String(config.font?.weight ?? fallbackFont.weight).trim() || fallbackFont.weight;

  return {
    ...config,
    adminEmail: String(config.adminEmail ?? '').trim(),
    systemId: String(config.systemId ?? '').trim(),
    siteName: String(config.siteName ?? '').trim(),
    siteDescription: String(config.siteDescription ?? '').trim(),
    statsApiEndpoint: String(config.statsApiEndpoint ?? '').trim(),
    font: {
      face,
      weight,
    },
  };
}

function normalizeFrontendConfig(config: FrontendSiteConfig): FrontendSiteConfig {
  const fallback = DEFAULT_SYSTEM_CONFIG.frontend;
  const favicon = String(config.faviconUrl ?? fallback.faviconUrl ?? '').trim();
  return {
    ...config,
    site: String(config.site ?? '').trim(),
    title: String(config.title ?? '').trim(),
    description: String(config.description ?? '').trim(),
    author: String(config.author ?? '').trim(),
    tags: normalizeList(config.tags ?? []),
    faviconUrl: favicon || fallback.faviconUrl,
    socialCardAvatarImage: String(config.socialCardAvatarImage ?? '').trim(),
    font: String(config.font ?? '').trim(),
    navLinks: normalizeNavLinks(config.navLinks ?? []),
    socialLinks: normalizeSocialLinks(config.socialLinks ?? {}),
    characters: normalizeCharacters(config.characters ?? {}),
    themes: {
      ...config.themes,
      include: normalizeList(config.themes?.include ?? []),
      overrides:
        config.themes?.overrides && Object.keys(config.themes.overrides).length > 0
          ? config.themes.overrides
          : undefined,
    },
    giscus: config.giscus && config.giscus.repo ? config.giscus : undefined,
  };
}

function normalizeOssConfig(config: OssConfig): OssConfig {
  const provider = config?.provider === 'minio' ? 'minio' : 'oss';
  const normalizeValue = (value?: string) => {
    const next = String(value ?? '').trim();
    return next ? next : undefined;
  };
  const rawQuality = Number(config?.imageCompressionQuality);
  const fallbackQuality = DEFAULT_SYSTEM_CONFIG.oss.imageCompressionQuality ?? 0.8;
  const imageCompressionQuality = Number.isFinite(rawQuality)
    ? Math.min(1, Math.max(0.1, rawQuality))
    : fallbackQuality;

  return {
    enabled: !!config?.enabled,
    provider,
    endpoint: normalizeValue(config?.endpoint),
    bucket: normalizeValue(config?.bucket),
    accessKey: normalizeValue(config?.accessKey),
    secretKey: normalizeValue(config?.secretKey),
    region: normalizeValue(config?.region),
    customDomain: normalizeValue(config?.customDomain),
    uploadPath: normalizeValue(config?.uploadPath),
    imageCompressionQuality,
  };
}

export const SystemConfigService = {
  async get(): Promise<SystemConfig> {
    const existing = await SystemConfigRepository.get();
    if (existing) {
      return {
        admin: normalizeAdminConfig(existing.admin as AdminConfig),
        frontend: normalizeFrontendConfig(existing.frontend as FrontendSiteConfig),
        oss: normalizeOssConfig((existing.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig),
      };
    }

    const admin = normalizeAdminConfig(DEFAULT_SYSTEM_CONFIG.admin);
    const frontend = normalizeFrontendConfig(DEFAULT_SYSTEM_CONFIG.frontend);
    const oss = normalizeOssConfig(DEFAULT_SYSTEM_CONFIG.oss);
    await SystemConfigRepository.upsert({ admin, frontend, oss });
    return { admin, frontend, oss };
  },

  async update(input: { actorId: string; admin: AdminConfig; frontend: FrontendSiteConfig; oss: OssConfig }) {
    const admin = normalizeAdminConfig(input.admin);
    const frontend = normalizeFrontendConfig(input.frontend);
    const ossInput = normalizeOssConfig(input.oss);
    const existing = await SystemConfigRepository.get();
    const existingOss = normalizeOssConfig((existing?.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig);
    const sanitizedSecret =
      ossInput.secretKey === MASKED_SECRET ? undefined : ossInput.secretKey;
    const oss: OssConfig = {
      ...existingOss,
      ...ossInput,
      secretKey: sanitizedSecret ?? existingOss.secretKey,
      accessKey: ossInput.accessKey ?? existingOss.accessKey,
    };
    const updated = await SystemConfigRepository.upsert({ admin, frontend, oss }, input.actorId);

    await FrontendSiteConfigSyncService.sync(frontend);
    return {
      admin: normalizeAdminConfig((updated?.admin ?? admin) as AdminConfig),
      frontend: normalizeFrontendConfig((updated?.frontend ?? frontend) as FrontendSiteConfig),
      oss: normalizeOssConfig((updated?.oss ?? oss) as OssConfig),
    };
  },
};
