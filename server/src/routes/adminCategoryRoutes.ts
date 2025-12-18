import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminCategoryController } from '../controllers/AdminCategoryController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.CATEGORY_MANAGE));

const objectIdParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id'),
  })
  .strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['ACTIVE', 'PENDING_DELETE']).optional(),
    ownerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  })
  .strict();

const deleteBodySchema = z
  .object({
    confirm: z.literal(true),
    graceDays: z.coerce.number().int().min(1).max(30).optional(),
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
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AdminCategoryController.list);
router.get('/:id', validateRequest({ params: objectIdParamsSchema }), AdminCategoryController.detail);
router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: deleteBodySchema }),
  AdminCategoryController.scheduleDelete
);
router.post(
  '/:id/restore',
  validateRequest({ params: objectIdParamsSchema, body: restoreBodySchema }),
  AdminCategoryController.restore
);
router.post(
  '/:id/purge',
  validateRequest({ params: objectIdParamsSchema, body: purgeBodySchema }),
  AdminCategoryController.purge
);
router.patch(
  '/:id/admin-meta',
  validateRequest({ params: objectIdParamsSchema, body: adminMetaBodySchema }),
  AdminCategoryController.updateAdminMeta
);

export default router;

