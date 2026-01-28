import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { SystemConfigController } from '../controllers/SystemConfigController';
import { AdminConfigDiagnosticsController } from '../controllers/AdminConfigDiagnosticsController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.SYSTEM_CONFIG));

const optionalString = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(200).optional()
);

const adminFontSchema = z
  .object({
    face: z.string().trim().min(1).max(200),
    weight: z.string().trim().min(1).max(50),
  })
  .strict();

const adminConfigSchema = z
  .object({
    adminEmail: z.string().trim().min(1).max(200),
    systemId: z.string().trim().min(1).max(100),
    siteName: z.string().trim().min(1).max(200),
    siteDescription: z.string().trim().min(1).max(500),
    maintenanceMode: z.boolean(),
    dashboardRefreshRate: z.coerce.number().int().min(500).max(600000),
    showQuickDraft: z.boolean(),
    enableAiAssistant: z.boolean(),
    autoSaveInterval: z.coerce.number().int().min(5).max(600),
    allowAuthorCustomCategories: z.boolean(),
    statsApiEndpoint: z.string().trim().min(1).max(200),
    statsTool: z.enum(['INTERNAL', 'GA4', 'UMAMI']),
    allowRegistration: z.boolean(),
    defaultUserRole: z.enum(['admin', 'author']),
    recycleBinRetentionDays: z.coerce.number().int().min(1).max(365),
    activeEffectMode: z.enum([
      'SNOW_FALL',
      'MATRIX_RAIN',
      'NEON_AMBIENT',
      'TERMINAL_GRID',
      'HEART_PARTICLES',
      'SCAN_LINES',
    ]),
    font: adminFontSchema.optional(),
    enableEnhancedSeo: z.boolean().optional(),
    adminTitle: optionalString,
    adminFavicon: optionalString,
    enableBgEffect: z.boolean().optional(),
    effectIntensity: z.coerce.number().min(0).max(1).optional(),
    previewLoadCover: z.boolean().optional(),
  })
  .strict();

const navLinkSchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    url: z.string().trim().min(1).max(200),
    external: z.boolean().optional(),
  })
  .strict();

const themeOverridesSchema = z.record(z.string().trim().min(1), z.record(z.string().trim().min(1), z.string()));

const themesSchema = z
  .object({
    mode: z.enum(['single', 'select', 'light-dark-auto']),
    default: z.string().trim().min(1).max(100),
    include: z.array(z.string().trim().min(1).max(100)).max(200),
    overrides: z.union([themeOverridesSchema, z.null()]).optional(),
  })
  .strict();

const socialLinksSchema = z
  .object({
    github: optionalString,
    twitter: optionalString,
    mastodon: optionalString,
    bluesky: optionalString,
    linkedin: optionalString,
    email: optionalString,
  })
  .strict();

const giscusSchema = z
  .object({
    repo: z.string().trim().min(1).max(200),
    repoId: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(100),
    categoryId: z.string().trim().min(1).max(100),
    reactionsEnabled: z.boolean(),
  })
  .strict();

const characterConfigItemSchema = z
  .object({
    id: z.string().trim().min(1).max(50),
    name: z.string().trim().min(1).max(50),
    avatar: z.string().trim().max(200),
    enable: z.boolean(),
  })
  .strict();

const maintenanceSchema = z
  .object({
    startAt: z.string().trim().min(1).max(50),
    endAt: z.string().trim().min(1).max(50),
    reason: z.string().trim().min(1).max(200),
  })
  .strict();

const frontendConfigSchema = z
  .object({
    site: z.string().trim().url(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(500),
    author: z.string().trim().min(1).max(100),
    tags: z.array(z.string().trim().min(1).max(50)).max(30),
    faviconUrl: z.string().trim().min(1).max(200),
    socialCardAvatarImage: z.string().trim().min(1).max(200),
    font: z.string().trim().min(1).max(120),
    pageSize: z.coerce.number().int().min(1).max(19),
    homePageSize: z.coerce.number().int().min(1).max(19).optional(),
    archivePageSize: z.coerce.number().int().min(1).max(19).optional(),
    categoryPageSize: z.coerce.number().int().min(1).max(19).optional(),
    tagPageSize: z.coerce.number().int().min(1).max(19).optional(),
    trailingSlashes: z.boolean(),
    navLinks: z.array(navLinkSchema).max(30),
    themes: themesSchema,
    socialLinks: socialLinksSchema,
    giscus: z.union([giscusSchema, z.null()]).optional(),
    characters: z.record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(200)),
    enableSeasonEffect: z.boolean().optional(),
    seasonEffectType: z.enum(['sakura', 'snow', 'leaves', 'fireflies', 'anniversary', 'none', 'auto']).optional(),
    seasonEffectIntensity: z.coerce.number().min(0).max(1).optional(),
    enableAnniversaryEffect: z.boolean().optional(),
    enableAuthorCard: z.boolean().optional(),
    enableAboutAuthorCard: z.boolean().optional(),
    enableFooterAuthorCard: z.boolean().optional(),
    authorCardStyle: z.enum(['minimal', 'detailed']).optional(),
    enableRecommendations: z.boolean().optional(),
    recommendationMode: z.enum(['tag', 'date', 'category', 'random']).optional(),
    recommendationCount: z.coerce.number().int().min(1).max(19).optional(),
    enableCharacters: z.boolean().optional(),
    activeCharacters: z.array(characterConfigItemSchema).max(30).optional(),
    siteMode: z.enum(['normal', 'maintenance']).optional(),
    maintenance: maintenanceSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.siteMode !== 'maintenance') return;
    if (!value.maintenance) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maintenance is required when siteMode=maintenance', path: ['maintenance'] });
      return;
    }
    if (!value.maintenance.startAt.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maintenance.startAt is required', path: ['maintenance', 'startAt'] });
    }
    if (!value.maintenance.endAt.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maintenance.endAt is required', path: ['maintenance', 'endAt'] });
    }
    if (!value.maintenance.reason.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'maintenance.reason is required', path: ['maintenance', 'reason'] });
    }
  });

const ossConfigSchema = z
  .object({
    enabled: z.boolean(),
    provider: z.enum(['oss', 'minio']),
    endpoint: optionalString,
    bucket: optionalString,
    accessKey: optionalString,
    secretKey: optionalString,
    region: optionalString,
    customDomain: optionalString,
    uploadPath: optionalString,
    imageCompressionQuality: z.coerce.number().min(0.1).max(1).optional(),
  })
  .strict();

const systemConfigSchema = z
  .object({
    admin: adminConfigSchema,
    frontend: frontendConfigSchema,
    oss: ossConfigSchema,
  })
  .strict();

const previewThemeSchema = z
  .object({
    themes: themesSchema,
    enableSeasonEffect: z.boolean().optional(),
    seasonEffectType: z.enum(['sakura', 'snow', 'leaves', 'fireflies', 'anniversary', 'none', 'auto']).optional(),
    seasonEffectIntensity: z.coerce.number().min(0).max(1).optional(),
    enableAnniversaryEffect: z.boolean().optional(),
  })
  .strict();

router.get('/', SystemConfigController.getAdminEditable);
router.patch('/', validateRequest({ body: systemConfigSchema }), SystemConfigController.update);
router.post('/publish', validateRequest({ body: systemConfigSchema }), SystemConfigController.publish);
router.post('/preview/theme', validateRequest({ body: previewThemeSchema }), SystemConfigController.previewTheme);
router.post('/preview/all', validateRequest({ body: systemConfigSchema }), SystemConfigController.previewAll);
router.get('/diagnostics', AdminConfigDiagnosticsController.get);

export default router;
