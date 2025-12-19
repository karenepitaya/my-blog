import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';
import { AuthorTagController } from '../controllers/AuthorTagController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requireRole(['author']));

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
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), AuthorTagController.list);
router.post('/', validateRequest({ body: createBodySchema }), AuthorTagController.create);

export default router;

