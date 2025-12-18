import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminUserController } from '../controllers/AdminUserController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.USER_MANAGE));

const objectIdParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user id'),
  })
  .strict();

const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(['ACTIVE', 'BANNED', 'PENDING_DELETE']).optional(),
    role: z.enum(['admin', 'author']).optional(),
  })
  .strict();

const createAuthorBodySchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be at most 100 characters')
      .optional(),
  })
  .strict();

const resetBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const banBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const deleteBodySchema = z
  .object({
    confirm: z.literal(true),
    graceDays: z.coerce.number().int().min(1).max(365).optional(),
  })
  .strict();

const restoreBodySchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

const purgeBodySchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

const adminMetaBodySchema = z
  .object({
    remark: z.union([z.string().trim().max(500), z.null()]).optional(),
    tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),
  })
  .strict();

router.get('/', validateRequest({ query: listUsersQuerySchema }), AdminUserController.listUsers);

router.post(
  '/',
  validateRequest({ body: createAuthorBodySchema }),
  AdminUserController.createAuthor
);

router.get(
  '/:id',
  validateRequest({ params: objectIdParamsSchema }),
  AdminUserController.getUserDetail
);

router.post(
  '/:id/reset',
  validateRequest({ params: objectIdParamsSchema, body: resetBodySchema }),
  AdminUserController.resetAuthor
);

router.post(
  '/:id/ban',
  validateRequest({ params: objectIdParamsSchema, body: banBodySchema }),
  AdminUserController.banAuthor
);

router.post(
  '/:id/unban',
  validateRequest({ params: objectIdParamsSchema }),
  AdminUserController.unbanAuthor
);

router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: deleteBodySchema }),
  AdminUserController.deleteAuthor
);

router.post(
  '/:id/restore',
  validateRequest({ params: objectIdParamsSchema, body: restoreBodySchema }),
  AdminUserController.restoreAuthor
);

router.post(
  '/:id/purge',
  validateRequest({ params: objectIdParamsSchema, body: purgeBodySchema }),
  AdminUserController.purgeAuthor
);

router.patch(
  '/:id/admin-meta',
  validateRequest({ params: objectIdParamsSchema, body: adminMetaBodySchema }),
  AdminUserController.updateAdminMeta
);

export default router;
