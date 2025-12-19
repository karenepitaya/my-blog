import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';
import { AuthorArticleController } from '../controllers/AuthorArticleController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requireRole(['author']));

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
    q: z.string().trim().min(1).max(200).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  })
  .strict();

const nullableText = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().max(max), z.null()]).optional()
  );

const categoryIdSchema = z.preprocess(
  value => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.union([z.string().regex(/^[0-9a-fA-F]{24}$/), z.null()]).optional()
);

const createBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    markdown: z.string().min(1),
    summary: nullableText(500),
    coverImageUrl: nullableText(2048),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    categoryId: categoryIdSchema,
  })
  .strict();

const updateBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    markdown: z.string().min(1).optional(),
    summary: nullableText(500),
    coverImageUrl: nullableText(2048),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    categoryId: categoryIdSchema,
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny =
      data.title !== undefined ||
      data.markdown !== undefined ||
      data.summary !== undefined ||
      data.coverImageUrl !== undefined ||
      data.tags !== undefined ||
      data.categoryId !== undefined;

    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No update fields provided' });
    }
  });

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

const requestRestoreBodySchema = z
  .object({
    message: nullableText(500),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AuthorArticleController.list);
router.post('/', validateRequest({ body: createBodySchema }), AuthorArticleController.create);
router.get('/:id', validateRequest({ params: objectIdParamsSchema }), AuthorArticleController.detail);
router.put(
  '/:id',
  validateRequest({ params: objectIdParamsSchema, body: updateBodySchema }),
  AuthorArticleController.update
);
router.post(
  '/:id/publish',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorArticleController.publish
);
router.post(
  '/:id/unpublish',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorArticleController.unpublish
);
router.post(
  '/:id/save-draft',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorArticleController.saveDraft
);
router.post(
  '/:id/delete',
  validateRequest({ params: objectIdParamsSchema, body: deleteBodySchema }),
  AuthorArticleController.remove
);
router.post(
  '/:id/restore',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorArticleController.restore
);
router.post(
  '/:id/request-restore',
  validateRequest({ params: objectIdParamsSchema, body: requestRestoreBodySchema }),
  AuthorArticleController.requestRestore
);
router.post(
  '/:id/confirm-delete',
  validateRequest({ params: objectIdParamsSchema, body: confirmBodySchema }),
  AuthorArticleController.confirmDelete
);

export default router;
