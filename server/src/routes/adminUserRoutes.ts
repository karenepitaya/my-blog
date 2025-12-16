import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminUserController } from '../controllers/AdminUserController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requirePermission(Permissions.USER_MANAGE));

const createAuthorBodySchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password must be at most 100 characters'),
  })
  .strict();

router.post(
  '/',
  validateRequest({ body: createAuthorBodySchema }),
  AdminUserController.createAuthor
);

export default router;

