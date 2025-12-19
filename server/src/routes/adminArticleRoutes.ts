import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminArticleController } from '../controllers/AdminArticleController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.ARTICLE_MANAGE));

const objectIdParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid article id'),
  })
  .strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['DRAFT', 'EDITING', 'PUBLISHED', 'PENDING_DELETE']).optional(),
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const nullableText = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().max(max), z.null()]).optional()
  );

const deleteBodySchema = z
  .object({
    confirm: z.literal(true),
    graceDays: z.coerce.number().int().min(1).max(30).optional(),
    reason: nullableText(500),
  })
  .strict();

const confirmBodySchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

const adminMetaBodySchema = z
  .object({
    remark: z.union([z.string().trim().max(500), z.null()]).optional(),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AdminArticleController.list);
router.get('/:id', validateRequest({ params: objectIdParamsSchema }), AdminArticleController.detail);
router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: deleteBodySchema }),
  AdminArticleController.scheduleDelete
);
router.post(
  '/:id/restore',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AdminArticleController.restore
);
router.post(
  '/:id/purge',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AdminArticleController.purge
);
router.patch(
  '/:id/admin-meta',
  validateRequest({ params: objectIdParamsSchema, body: adminMetaBodySchema }),
  AdminArticleController.updateAdminMeta
);

export default router;

