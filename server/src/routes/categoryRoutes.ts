import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';
import { AuthorCategoryController } from '../controllers/AuthorCategoryController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requireRole(['author']));

const objectIdParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category id'),
  })
  .strict();

const listQuerySchema = z
  .object({
    status: z.enum(['ACTIVE', 'PENDING_DELETE']).optional(),
  })
  .strict();

const nullableText = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().max(max), z.null()]).optional()
  );

const descriptionSchema = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.union([z.string().trim().max(200), z.null()]).optional()
);

const createBodySchema = z
  .object({
    name: z.string().trim().min(1).max(50),
    slug: z.string().trim().min(1).max(100).optional(),
    description: descriptionSchema,
    coverImageUrl: nullableText(2048),
  })
  .strict();

const updateBodySchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    slug: z.string().trim().min(1).max(100).optional(),
    description: descriptionSchema,
    coverImageUrl: nullableText(2048),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny =
      data.name !== undefined ||
      data.slug !== undefined ||
      data.description !== undefined ||
      data.coverImageUrl !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No update fields provided' });
    }
  });

const confirmBodySchema = z
  .object({
    confirm: z.literal(true),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AuthorCategoryController.list);
router.post('/', validateRequest({ body: createBodySchema }), AuthorCategoryController.create);
router.get('/:id', validateRequest({ params: objectIdParamsSchema }), AuthorCategoryController.detail);
router.put(
  '/:id',
  validateRequest({ params: objectIdParamsSchema, body: updateBodySchema }),
  AuthorCategoryController.update
);
router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorCategoryController.remove
);
router.post(
  '/:id/restore',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorCategoryController.restore
);
router.post(
  '/:id/confirm-delete',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorCategoryController.confirmDelete
);

export default router;
