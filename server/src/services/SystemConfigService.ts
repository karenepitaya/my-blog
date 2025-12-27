import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';
import type { AdminConfig, FrontendSiteConfig, NavLink, SocialLinks, SystemConfig } from '../interfaces/SystemConfig';
import { SystemConfigRepository } from '../repositories/SystemConfigRepository';
import { FrontendSiteConfigSyncService } from './FrontendSiteConfigSyncService';

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
  return {
    ...config,
    adminEmail: String(config.adminEmail ?? '').trim(),
    systemId: String(config.systemId ?? '').trim(),
    siteName: String(config.siteName ?? '').trim(),
    siteDescription: String(config.siteDescription ?? '').trim(),
    statsApiEndpoint: String(config.statsApiEndpoint ?? '').trim(),
  };
}

function normalizeFrontendConfig(config: FrontendSiteConfig): FrontendSiteConfig {
  return {
    ...config,
    site: String(config.site ?? '').trim(),
    title: String(config.title ?? '').trim(),
    description: String(config.description ?? '').trim(),
    author: String(config.author ?? '').trim(),
    tags: normalizeList(config.tags ?? []),
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

export const SystemConfigService = {
  async get(): Promise<SystemConfig> {
    const existing = await SystemConfigRepository.get();
    if (existing) {
      return {
        admin: normalizeAdminConfig(existing.admin as AdminConfig),
        frontend: normalizeFrontendConfig(existing.frontend as FrontendSiteConfig),
      };
    }

    const admin = normalizeAdminConfig(DEFAULT_SYSTEM_CONFIG.admin);
    const frontend = normalizeFrontendConfig(DEFAULT_SYSTEM_CONFIG.frontend);
    await SystemConfigRepository.upsert({ admin, frontend });
    return { admin, frontend };
  },

  async update(input: { actorId: string; admin: AdminConfig; frontend: FrontendSiteConfig }) {
    const admin = normalizeAdminConfig(input.admin);
    const frontend = normalizeFrontendConfig(input.frontend);
    const updated = await SystemConfigRepository.upsert({ admin, frontend }, input.actorId);

    await FrontendSiteConfigSyncService.sync(frontend);
    return {
      admin: normalizeAdminConfig((updated?.admin ?? admin) as AdminConfig),
      frontend: normalizeFrontendConfig((updated?.frontend ?? frontend) as FrontendSiteConfig),
    };
  },
};
