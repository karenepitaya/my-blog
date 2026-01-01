import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminTagController } from '../controllers/AdminTagController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.TAG_MANAGE));

const objectIdParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid tag id'),
  })
  .strict();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const createBodySchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    color: z.string().trim().max(20).optional().nullable(),
    effect: z.enum(['glow', 'pulse', 'none']).optional(),
    description: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

const updateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string().trim().max(20).optional().nullable(),
    effect: z.enum(['glow', 'pulse', 'none']).optional(),
    description: z.string().trim().max(500).optional().nullable(),
  })
  .strict()
  .refine(input => Object.values(input).some(value => value !== undefined), {
    message: 'At least one field is required',
  });

const confirmBodySchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AdminTagController.list);
router.post('/', validateRequest({ body: createBodySchema }), AdminTagController.create);
router.get('/:id', validateRequest({ params: objectIdParamsSchema }), AdminTagController.detail);
router.patch(
  '/:id',
  validateRequest({ params: objectIdParamsSchema, body: updateBodySchema }),
  AdminTagController.update
);
router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AdminTagController.delete
);

export default router;
