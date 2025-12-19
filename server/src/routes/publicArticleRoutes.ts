import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { PublicArticleController } from '../controllers/PublicArticleController';

const router: ExpressRouter = Router();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    tag: z.string().trim().min(1).max(30).optional(),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const idParamsSchema = z
  .object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid article id'),
  })
  .strict();

const slugParamsSchema = z
  .object({
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid author id'),
    slug: z.string().trim().min(1).max(200),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), PublicArticleController.list);
router.get(
  '/slug/:authorId/:slug',
  validateRequest({ params: slugParamsSchema }),
  PublicArticleController.detailBySlug
);
router.get('/:id', validateRequest({ params: idParamsSchema }), PublicArticleController.detailById);

export default router;

