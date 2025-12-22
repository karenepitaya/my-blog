import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { PublicAuthorController } from '../controllers/PublicAuthorController';

const router: ExpressRouter = Router();

const listQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(200).default(50),
    q: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

const usernameParamsSchema = z
  .object({
    username: z.string().trim().min(3).max(30),
  })
  .strict();

router.get('/', validateRequest({ query: listQuerySchema }), PublicAuthorController.list);
router.get(
  '/username/:username',
  validateRequest({ params: usernameParamsSchema }),
  PublicAuthorController.detailByUsername
);

export default router;
