import { DEFAULT_SYSTEM_CONFIG } from '../config/defaultSystemConfig';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  AdminConfig,
  CharacterConfigItem,
  SeasonEffectType,
  AuthorCardStyle,
  RecommendationMode,
  FrontendSiteConfig,
  NavLink,
  OssConfig,
  SocialLinks,
  SystemConfig,
} from '../interfaces/SystemConfig';
import { SystemConfigRepository, SYSTEM_CONFIG_KEYS } from '../repositories/SystemConfigRepository';
import { FrontendSiteConfigSyncService } from './FrontendSiteConfigSyncService';

const MASKED_SECRET = '******';

type PublishedCacheEntry = {
  value: SystemConfig;
  loadedAt: number;
};

let publishedCache: PublishedCacheEntry | null = null;
let devPreviewOverride: PublishedCacheEntry | null = null;
let devPreviewFilePath: string | null = null;
let devPreviewAppliedAt: number | null = null;

async function pathExists(fsPath: string): Promise<boolean> {
  try {
    await fs.access(fsPath);
    return true;
  } catch {
    return false;
  }
}

async function resolveDevPreviewPath(): Promise<string> {
  if (devPreviewFilePath) return devPreviewFilePath;

  const raw = process.env.SYSTEM_CONFIG_DEV_PREVIEW_PATH?.trim();
  if (raw) {
    devPreviewFilePath = path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
    return devPreviewFilePath;
  }

  const cwd = process.cwd();
  const candidateFromRepoRoot = path.resolve(cwd, '.tmp', 'system-config.preview.json');
  const candidateFromServerDir = path.resolve(cwd, '..', '.tmp', 'system-config.preview.json');

  devPreviewFilePath = (await pathExists(path.resolve(cwd, 'frontend'))) ? candidateFromRepoRoot : candidateFromServerDir;
  return devPreviewFilePath;
}

function isDevPreviewEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const raw = process.env.SYSTEM_CONFIG_DEV_PREVIEW?.trim().toLowerCase();
  if (raw === 'false') return false;
  return true;
}

async function writeDevPreviewFile(config: SystemConfig): Promise<string> {
  const target = await resolveDevPreviewPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(config, null, 2), 'utf8');
  return target;
}

async function readDevPreviewFile(): Promise<SystemConfig> {
  const target = await resolveDevPreviewPath();
  const raw = await fs.readFile(target, 'utf8');
  const parsed = JSON.parse(raw);
  return parsed as SystemConfig;
}

function isPublishedCacheEnabled(): boolean {
  const raw = process.env.SYSTEM_CONFIG_CACHE?.trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

function publishedCacheTtlMs(): number {
  const raw = process.env.SYSTEM_CONFIG_CACHE_TTL_MS?.trim();
  if (!raw) return Number.POSITIVE_INFINITY;
  const value = Number(raw);
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  if (value < 0) return Number.POSITIVE_INFINITY;
  return value;
}

function normalizeList(values: string[]) {
  const trimmed = values.map(value => value.trim()).filter(Boolean);
  return Array.from(new Set(trimmed));
}

function normalizeNavLinks(links: NavLink[]) {
  return links
    .map(link => {
      const name = String(link.name ?? '').trim();
      const url = String(link.url ?? '').trim();
      const external = link.external ? true : undefined;
      return external ? { name, url, external: true } : { name, url };
    })
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

function normalizePageSize(input: unknown, fallback: number, limits?: { min?: number; max?: number }): number {
  const min = limits?.min ?? 1;
  const max = limits?.max ?? 19;
  const raw = Number(input);
  if (!Number.isFinite(raw)) return fallback;
  const value = Math.floor(raw);
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function normalizeSeasonEffectType(input: unknown, fallback: SeasonEffectType): SeasonEffectType {
  const value = String(input ?? '').trim();
  if (
    value === 'sakura' ||
    value === 'snow' ||
    value === 'leaves' ||
    value === 'fireflies' ||
    value === 'anniversary' ||
    value === 'none' ||
    value === 'auto'
  )
    return value;
  return fallback;
}

function normalizeIntensity(input: unknown, fallback: number): number {
  const raw = Number(input);
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(1, Math.max(0, raw));
}

function normalizeAuthorCardStyle(input: unknown, fallback: AuthorCardStyle): AuthorCardStyle {
  const value = String(input ?? '').trim();
  if (value === 'minimal' || value === 'detailed') return value;
  return fallback;
}

function normalizeRecommendationMode(
  input: unknown,
  fallback: RecommendationMode
): RecommendationMode {
  const value = String(input ?? '').trim();
  if (value === 'tag' || value === 'date' || value === 'category' || value === 'random') return value;
  return fallback;
}

function normalizeActiveCharacters(input: unknown, fallback: CharacterConfigItem[] | undefined): CharacterConfigItem[] {
  const list = Array.isArray(input) ? input : [];
  const result: CharacterConfigItem[] = [];
  const seen = new Set<string>();

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String((raw as any).id ?? '').trim();
    const name = String((raw as any).name ?? '').trim();
    const avatar = String((raw as any).avatar ?? '').trim();
    const enable = Boolean((raw as any).enable);
    const nextId = id || name;
    if (!nextId || !name) continue;
    if (seen.has(nextId)) continue;
    seen.add(nextId);
    result.push({ id: nextId.slice(0, 50), name: name.slice(0, 50), avatar: avatar.slice(0, 200), enable });
    if (result.length >= 30) break;
  }

  if (result.length > 0) return result;
  if (Array.isArray(fallback) && fallback.length > 0) return fallback;
  return [];
}

function buildEnabledCharacterRecord(input: CharacterConfigItem[]) {
  const result: Record<string, string> = {};
  for (const item of input ?? []) {
    if (!item?.enable) continue;
    const name = String(item.name ?? '').trim();
    const avatar = String(item.avatar ?? '').trim();
    if (!name || !avatar) continue;
    result[name] = avatar;
  }
  return result;
}

function normalizeAdminConfig(config: AdminConfig): AdminConfig {
  const fallbackFont = DEFAULT_SYSTEM_CONFIG.admin.font;
  const fallback = DEFAULT_SYSTEM_CONFIG.admin;
  const face = String(config.font?.face ?? fallbackFont.face).trim() || fallbackFont.face;
  const weight = String(config.font?.weight ?? fallbackFont.weight).trim() || fallbackFont.weight;
  const allowedRetentionDays = [7, 15, 30];
  const rawRecycle = Number((config as any).recycleBinRetentionDays);
  const recycleFallback = Number(fallback.recycleBinRetentionDays ?? 30);
  const recycleCandidate = Number.isFinite(rawRecycle) ? Math.floor(rawRecycle) : recycleFallback;
  const recycleBinRetentionDays = allowedRetentionDays.includes(recycleCandidate) ? recycleCandidate : recycleFallback;

  const allowedAutoSave = [30, 60, 120, 360];
  const rawAutoSave = Number((config as any).autoSaveInterval);
  const autoSaveFallback = Number(fallback.autoSaveInterval ?? 120);
  const autoSaveCandidate = Number.isFinite(rawAutoSave) ? Math.floor(rawAutoSave) : autoSaveFallback;
  const autoSaveInterval = allowedAutoSave.includes(autoSaveCandidate) ? autoSaveCandidate : autoSaveFallback;

  const rawIntensity = Number((config as any).effectIntensity);
  const effectIntensity = Number.isFinite(rawIntensity)
    ? Math.min(1, Math.max(0, rawIntensity))
    : Number(fallback.effectIntensity ?? 0.8);
  const adminTitle = String((config as any).adminTitle ?? fallback.adminTitle ?? '').trim() || 'MultiTerm Admin';
  const adminFavicon = String((config as any).adminFavicon ?? fallback.adminFavicon ?? '').trim() || '/admin-favicon.png';

  return {
    ...config,
    adminEmail: String(config.adminEmail ?? '').trim(),
    systemId: String(config.systemId ?? '').trim(),
    siteName: String(config.siteName ?? '').trim(),
    siteDescription: String(config.siteDescription ?? '').trim(),
    statsApiEndpoint: String(config.statsApiEndpoint ?? '').trim(),
    recycleBinRetentionDays,
    autoSaveInterval,
    font: {
      face,
      weight,
    },
    enableEnhancedSeo:
      typeof (config as any).enableEnhancedSeo === 'boolean' ? (config as any).enableEnhancedSeo : Boolean(fallback.enableEnhancedSeo),
    adminTitle,
    adminFavicon,
    enableBgEffect:
      typeof (config as any).enableBgEffect === 'boolean' ? (config as any).enableBgEffect : Boolean(fallback.enableBgEffect),
    effectIntensity,
    previewLoadCover:
      typeof (config as any).previewLoadCover === 'boolean' ? (config as any).previewLoadCover : Boolean(fallback.previewLoadCover),
  };
}

function normalizeFrontendConfig(config: FrontendSiteConfig): FrontendSiteConfig {
  const fallback = DEFAULT_SYSTEM_CONFIG.frontend;
  const favicon = String(config.faviconUrl ?? fallback.faviconUrl ?? '').trim();
  const themesOverrides =
    config.themes?.overrides && Object.keys(config.themes.overrides).length > 0 ? config.themes.overrides : undefined;
  const giscus = config.giscus && config.giscus.repo ? config.giscus : undefined;
  const siteMode = (config as any).siteMode === 'maintenance' ? 'maintenance' : 'normal';
  const rawMaintenance = (config as any).maintenance;
  const maintenance =
    rawMaintenance && typeof rawMaintenance === 'object'
      ? {
          startAt: String((rawMaintenance as any).startAt ?? '').trim(),
          endAt: String((rawMaintenance as any).endAt ?? '').trim(),
          reason: String((rawMaintenance as any).reason ?? '').trim(),
        }
      : undefined;
  const pageSize = normalizePageSize(6, 6);
  const archivePageSize = normalizePageSize((config as any).archivePageSize, pageSize);
  const categoryPageSize = normalizePageSize((config as any).categoryPageSize, pageSize);
  const tagPageSize = normalizePageSize((config as any).tagPageSize, pageSize);
  const homePageSize = normalizePageSize((config as any).homePageSize, pageSize);

  const enableSeasonEffect =
    typeof (config as any).enableSeasonEffect === 'boolean'
      ? (config as any).enableSeasonEffect
      : Boolean(fallback.enableSeasonEffect);
  const enableAnniversaryEffectRaw =
    typeof (config as any).enableAnniversaryEffect === 'boolean'
      ? (config as any).enableAnniversaryEffect
      : Boolean((fallback as any).enableAnniversaryEffect);
  const enableAnniversaryEffect = enableSeasonEffect ? enableAnniversaryEffectRaw : false;
  let seasonEffectType = normalizeSeasonEffectType((config as any).seasonEffectType, fallback.seasonEffectType ?? 'auto');
  if (enableSeasonEffect && seasonEffectType === 'none') {
    seasonEffectType = 'auto';
  }
  if (seasonEffectType === 'anniversary') {
    // Anniversary is date-gated by `enableAnniversaryEffect` on the client.
    // Keep config stable by not persisting `anniversary` as a seasonal selection.
    seasonEffectType = 'auto';
  }

  let seasonEffectIntensity = normalizeIntensity(
    (config as any).seasonEffectIntensity,
    normalizeIntensity((fallback as any).seasonEffectIntensity, 0.8)
  );
  if (enableSeasonEffect && seasonEffectIntensity < 0.1) {
    seasonEffectIntensity = 0.1;
  }
  const legacyEnableAuthorCard =
    typeof (config as any).enableAuthorCard === 'boolean'
      ? (config as any).enableAuthorCard
      : Boolean((fallback as any).enableAuthorCard);
  const enableAboutAuthorCard =
    true;
  const enableFooterAuthorCard =
    typeof (config as any).enableFooterAuthorCard === 'boolean'
      ? (config as any).enableFooterAuthorCard
      : legacyEnableAuthorCard;
  const enableAuthorCard = enableAboutAuthorCard || enableFooterAuthorCard;
  const authorCardStyle = normalizeAuthorCardStyle((config as any).authorCardStyle, fallback.authorCardStyle ?? 'detailed');
  const enableRecommendations =
    typeof (config as any).enableRecommendations === 'boolean'
      ? (config as any).enableRecommendations
      : Boolean(fallback.enableRecommendations);
  const recommendationMode = normalizeRecommendationMode((config as any).recommendationMode, fallback.recommendationMode ?? 'tag');
  const recommendationCount = normalizePageSize(
    (config as any).recommendationCount,
    normalizePageSize((fallback as any).recommendationCount, 6, { min: 1, max: 19 }),
    { min: 1, max: 19 }
  );
  const enableCharacters =
    typeof (config as any).enableCharacters === 'boolean' ? (config as any).enableCharacters : Boolean(fallback.enableCharacters);

  const derivedFallbackActive =
    Array.isArray(fallback.activeCharacters) && fallback.activeCharacters.length > 0
      ? fallback.activeCharacters
      : Object.entries(fallback.characters ?? {}).map(([name, avatar]) => ({
          id: name,
          name,
          avatar,
          enable: true,
        }));

  const rawActiveCharacters =
    Array.isArray((config as any).activeCharacters) && (config as any).activeCharacters.length > 0
      ? (config as any).activeCharacters
      : Object.entries(config.characters ?? {}).map(([name, avatar]) => ({
          id: name,
          name,
          avatar,
          enable: true,
        }));
  const activeCharacters = normalizeActiveCharacters(rawActiveCharacters, derivedFallbackActive);
  const enabledCharactersRecord = enableCharacters ? buildEnabledCharacterRecord(activeCharacters) : {};

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
    siteMode,
    pageSize,
    homePageSize,
    archivePageSize,
    categoryPageSize,
    tagPageSize,
    navLinks: normalizeNavLinks(config.navLinks ?? []),
    socialLinks: normalizeSocialLinks(config.socialLinks ?? {}),
    enableSeasonEffect,
    seasonEffectType,
    seasonEffectIntensity,
    enableAnniversaryEffect,
    enableAuthorCard,
    enableAboutAuthorCard,
    enableFooterAuthorCard,
    authorCardStyle,
    enableRecommendations,
    recommendationMode,
    recommendationCount,
    enableCharacters,
    activeCharacters,
    characters: normalizeCharacters(enabledCharactersRecord),
    themes: {
      ...config.themes,
      include: normalizeList(config.themes?.include ?? []),
      ...(themesOverrides ? { overrides: themesOverrides } : {}),
    },
    ...(giscus ? { giscus } : {}),
    ...(maintenance && maintenance.startAt && maintenance.endAt && maintenance.reason ? { maintenance } : {}),
  };
}

function normalizeOssConfig(config: OssConfig): OssConfig {
  const provider = config?.provider === 'minio' ? 'minio' : 'oss';
  const normalizeValue = (value?: string) => {
    const next = String(value ?? '').trim();
    return next ? next : undefined;
  };
  const endpoint = normalizeValue(config?.endpoint);
  const bucket = normalizeValue(config?.bucket);
  const accessKey = normalizeValue(config?.accessKey);
  const secretKey = normalizeValue(config?.secretKey);
  const region = normalizeValue(config?.region);
  const customDomain = normalizeValue(config?.customDomain);
  const uploadPath = normalizeValue(config?.uploadPath);
  const rawQuality = Number(config?.imageCompressionQuality);
  const fallbackQuality = DEFAULT_SYSTEM_CONFIG.oss.imageCompressionQuality ?? 0.8;
  const imageCompressionQuality = Number.isFinite(rawQuality)
    ? Math.min(1, Math.max(0.1, rawQuality))
    : fallbackQuality;

  const result: OssConfig = {
    enabled: !!config?.enabled,
    provider,
    imageCompressionQuality,
  };

  if (endpoint) result.endpoint = endpoint;
  if (bucket) result.bucket = bucket;
  if (accessKey) result.accessKey = accessKey;
  if (secretKey) result.secretKey = secretKey;
  if (region) result.region = region;
  if (customDomain) result.customDomain = customDomain;
  if (uploadPath) result.uploadPath = uploadPath;

  return result;
}

async function ensurePublishedExists(): Promise<SystemConfig> {
  const existing = await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published);
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
  await SystemConfigRepository.upsertByKey(SYSTEM_CONFIG_KEYS.published, { admin, frontend, oss });
  return { admin, frontend, oss };
}

async function getPublishedInternal(options?: { bypassCache?: boolean }): Promise<SystemConfig> {
  const bypassCache = options?.bypassCache === true;
  const cacheEnabled = isPublishedCacheEnabled();

  if (!bypassCache && cacheEnabled && publishedCache) {
    const ttl = publishedCacheTtlMs();
    if (Date.now() - publishedCache.loadedAt <= ttl) return publishedCache.value;
  }

  const config = await ensurePublishedExists();
  if (cacheEnabled) {
    publishedCache = { value: config, loadedAt: Date.now() };
  }
  return config;
}

function mergeOssWithExistingSecret(input: OssConfig, existing: OssConfig): OssConfig {
  const ossInput = normalizeOssConfig(input);
  const existingOss = normalizeOssConfig(existing);
  const nextSecretKey =
    ossInput.secretKey === MASKED_SECRET ? existingOss.secretKey : ossInput.secretKey ?? existingOss.secretKey;
  const nextAccessKey = ossInput.accessKey ?? existingOss.accessKey;

  return {
    ...existingOss,
    ...ossInput,
    ...(nextAccessKey ? { accessKey: nextAccessKey } : {}),
    ...(nextSecretKey ? { secretKey: nextSecretKey } : {}),
  };
}

export const SystemConfigService = {
  async get(options?: { bypassCache?: boolean }): Promise<SystemConfig> {
    if (!options?.bypassCache && isDevPreviewEnabled() && devPreviewOverride) {
      return devPreviewOverride.value;
    }
    return getPublishedInternal(options);
  },

  async getAdminEditable(): Promise<SystemConfig> {
    const draft = await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.draft);
    if (draft) {
      return {
        admin: normalizeAdminConfig(draft.admin as AdminConfig),
        frontend: normalizeFrontendConfig(draft.frontend as FrontendSiteConfig),
        oss: normalizeOssConfig((draft.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig),
      };
    }

    const published = await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published);
    if (published) {
      return {
        admin: normalizeAdminConfig(published.admin as AdminConfig),
        frontend: normalizeFrontendConfig(published.frontend as FrontendSiteConfig),
        oss: normalizeOssConfig((published.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig),
      };
    }

    return ensurePublishedExists();
  },

  async updateDraft(input: { actorId: string; admin: AdminConfig; frontend: FrontendSiteConfig; oss: OssConfig }) {
    const admin = normalizeAdminConfig(input.admin);
    const frontend = normalizeFrontendConfig(input.frontend);

    const draftExisting =
      (await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.draft)) ??
      (await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published));
    const baseOss = (draftExisting?.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig;
    const oss = mergeOssWithExistingSecret(input.oss, baseOss);

    const updated = await SystemConfigRepository.upsertByKey(
      SYSTEM_CONFIG_KEYS.draft,
      { admin, frontend, oss },
      input.actorId
    );
    return {
      admin: normalizeAdminConfig((updated?.admin ?? admin) as AdminConfig),
      frontend: normalizeFrontendConfig((updated?.frontend ?? frontend) as FrontendSiteConfig),
      oss: normalizeOssConfig((updated?.oss ?? oss) as OssConfig),
    };
  },

  async publish(input: { actorId: string; admin: AdminConfig; frontend: FrontendSiteConfig; oss: OssConfig }) {
    const admin = normalizeAdminConfig(input.admin);
    const frontend = normalizeFrontendConfig(input.frontend);

    const existingPublished = await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published);
    const baseOss = (existingPublished?.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig;
    const oss = mergeOssWithExistingSecret(input.oss, baseOss);

    const published = await SystemConfigRepository.upsertByKey(
      SYSTEM_CONFIG_KEYS.published,
      { admin, frontend, oss },
      input.actorId
    );

    await SystemConfigRepository.upsertByKey(
      SYSTEM_CONFIG_KEYS.draft,
      { admin, frontend, oss },
      input.actorId
    );

    // Route B (发布生效)：生产环境默认不热更新运行中 server 的内存配置。
    if (process.env.NODE_ENV !== 'production' || process.env.SYSTEM_CONFIG_APPLY_ON_PUBLISH === 'true') {
      publishedCache = { value: { admin, frontend, oss }, loadedAt: Date.now() };
    }

    return {
      admin: normalizeAdminConfig((published?.admin ?? admin) as AdminConfig),
      frontend: normalizeFrontendConfig((published?.frontend ?? frontend) as FrontendSiteConfig),
      oss: normalizeOssConfig((published?.oss ?? oss) as OssConfig),
    };
  },

  async previewThemeExport(input: {
    actorId: string;
    themes: FrontendSiteConfig['themes'];
    enableSeasonEffect?: boolean;
    seasonEffectType?: SeasonEffectType;
    seasonEffectIntensity?: number;
    enableAnniversaryEffect?: boolean;
  }): Promise<{ path: string }> {
    if (process.env.NODE_ENV === 'production') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Preview is only available in development' };
    }

    const published = await ensurePublishedExists();
    const draftExisting =
      (await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.draft)) ??
      (await SystemConfigRepository.getByKey(SYSTEM_CONFIG_KEYS.published));

    const baseDraft = draftExisting
      ? {
          admin: normalizeAdminConfig(draftExisting.admin as AdminConfig),
          frontend: normalizeFrontendConfig(draftExisting.frontend as FrontendSiteConfig),
          oss: normalizeOssConfig((draftExisting.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig),
        }
      : published;

    const patchedDraftFrontend = normalizeFrontendConfig({
      ...(baseDraft.frontend as any),
      themes: input.themes,
      ...(typeof input.enableSeasonEffect === 'boolean' ? { enableSeasonEffect: input.enableSeasonEffect } : {}),
      ...(input.seasonEffectType ? { seasonEffectType: input.seasonEffectType } : {}),
      ...(typeof input.seasonEffectIntensity === 'number' ? { seasonEffectIntensity: input.seasonEffectIntensity } : {}),
      ...(typeof input.enableAnniversaryEffect === 'boolean'
        ? { enableAnniversaryEffect: input.enableAnniversaryEffect }
        : {}),
    } as FrontendSiteConfig);

    await SystemConfigRepository.upsertByKey(
      SYSTEM_CONFIG_KEYS.draft,
      {
        admin: baseDraft.admin,
        frontend: patchedDraftFrontend,
        oss: baseDraft.oss,
      },
      input.actorId
    );

    const previewFrontend = normalizeFrontendConfig({
      ...(published.frontend as any),
      themes: patchedDraftFrontend.themes,
      enableSeasonEffect: (patchedDraftFrontend as any).enableSeasonEffect,
      seasonEffectType: (patchedDraftFrontend as any).seasonEffectType,
      seasonEffectIntensity: (patchedDraftFrontend as any).seasonEffectIntensity,
      enableAnniversaryEffect: (patchedDraftFrontend as any).enableAnniversaryEffect,
    } as FrontendSiteConfig);

    return FrontendSiteConfigSyncService.sync(previewFrontend);
  },

  async previewAllExport(input: { actorId: string; admin: AdminConfig; frontend: FrontendSiteConfig; oss: OssConfig }): Promise<{
    previewPath: string;
    frontendSiteConfigPath: string;
    appliedAt: number;
  }> {
    if (process.env.NODE_ENV === 'production') {
      throw { status: 404, code: 'NOT_FOUND', message: 'Preview is only available in development' };
    }

    const published = await ensurePublishedExists();
    const baseOss = (published?.oss ?? DEFAULT_SYSTEM_CONFIG.oss) as OssConfig;

    const admin = normalizeAdminConfig(input.admin);
    const frontend = normalizeFrontendConfig(input.frontend);
    const oss = mergeOssWithExistingSecret(input.oss, baseOss);

    // Persist as draft (still Route B; no publish).
    await SystemConfigRepository.upsertByKey(
      SYSTEM_CONFIG_KEYS.draft,
      { admin, frontend, oss },
      input.actorId
    );

    // Dev-only: write preview snapshot to a global file, then load/apply it from that file.
    const previewPath = await writeDevPreviewFile({ admin, frontend, oss });
    const loaded = await readDevPreviewFile();
    const applied: SystemConfig = {
      admin: normalizeAdminConfig((loaded.admin ?? admin) as AdminConfig),
      frontend: normalizeFrontendConfig((loaded.frontend ?? frontend) as FrontendSiteConfig),
      oss: normalizeOssConfig((loaded.oss ?? oss) as OssConfig),
    };

    devPreviewOverride = { value: applied, loadedAt: Date.now() };
    devPreviewAppliedAt = devPreviewOverride.loadedAt;

    const frontendResult = await FrontendSiteConfigSyncService.sync(applied.frontend);
    return { previewPath, frontendSiteConfigPath: frontendResult.path, appliedAt: devPreviewAppliedAt };
  },
};
