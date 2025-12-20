import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { PublicTagController } from '../controllers/PublicTagController';

const router: ExpressRouter = Router();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const slugParamsSchema = z
  .object({
    slug: z.string().trim().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug'),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), PublicTagController.list);
router.get('/:slug', validateRequest({ params: slugParamsSchema }), PublicTagController.detailBySlug);

export default router;

