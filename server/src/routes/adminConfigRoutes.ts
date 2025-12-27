import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { SystemConfigController } from '../controllers/SystemConfigController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.SYSTEM_CONFIG));

const optionalString = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().max(200).optional()
);

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
    overrides: themeOverridesSchema.optional(),
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

const frontendConfigSchema = z
  .object({
    site: z.string().trim().url(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(500),
    author: z.string().trim().min(1).max(100),
    tags: z.array(z.string().trim().min(1).max(50)).max(30),
    socialCardAvatarImage: z.string().trim().min(1).max(200),
    font: z.string().trim().min(1).max(120),
    pageSize: z.coerce.number().int().min(1).max(100),
    trailingSlashes: z.boolean(),
    navLinks: z.array(navLinkSchema).max(30),
    themes: themesSchema,
    socialLinks: socialLinksSchema,
    giscus: z.union([giscusSchema, z.null()]).optional(),
    characters: z.record(z.string().trim().min(1).max(50), z.string().trim().min(1).max(200)),
  })
  .strict();

const systemConfigSchema = z
  .object({
    admin: adminConfigSchema,
    frontend: frontendConfigSchema,
  })
  .strict();

router.patch('/', validateRequest({ body: systemConfigSchema }), SystemConfigController.update);

export default router;
