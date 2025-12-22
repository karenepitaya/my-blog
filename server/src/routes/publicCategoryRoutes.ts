import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { PublicCategoryController } from '../controllers/PublicCategoryController';

const router: ExpressRouter = Router();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  })
  .strict();

const slugParamsSchema = z
  .object({
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid author id'),
    slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/i, 'Invalid slug'),
  })
  .strict();

const authorUsernameSlugParamsSchema = z
  .object({
    authorUsername: z.string().trim().min(3).max(30),
    slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/i, 'Invalid slug'),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), PublicCategoryController.list);
router.get(
  '/slug/:authorId/:slug',
  validateRequest({ params: slugParamsSchema }),
  PublicCategoryController.detailBySlug
);
router.get(
  '/by-author/:authorUsername/:slug',
  validateRequest({ params: authorUsernameSlugParamsSchema }),
  PublicCategoryController.detailByAuthorUsername
);

export default router;
