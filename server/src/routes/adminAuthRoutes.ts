import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';

const router: ExpressRouter = Router();

const loginBodySchema = z
  .object({
    username: z.string().trim().min(3).max(30),
    password: z.string().min(6).max(100),
  })
  .strict();

const impersonateBodySchema = z
  .object({
    authorId: z.string().regex(/^[0-9a-fA-F]{24}$/),
    reason: z.string().trim().max(500).optional(),
  })
  .strict();

router.get('/debug-accounts', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.error(404, 'NOT_FOUND', 'Not found');
  }

  const adminUsername = (process.env.ADMIN_USERNAME ?? '').trim();
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  const authorUsername = (process.env.USER_USERNAME ?? '').trim();
  const authorPassword = process.env.USER_PASSWORD ?? '';

  const admin = adminUsername && adminPassword ? { username: adminUsername, password: adminPassword } : null;
  const author =
    authorUsername && authorPassword ? { username: authorUsername, password: authorPassword } : null;

  return res.success({ admin, author });
});

router.post('/login', validateRequest({ body: loginBodySchema }), AdminAuthController.login);
router.get('/me', adminAuthMiddleware, AdminAuthController.me);
router.post(
  '/impersonate',
  adminAuthMiddleware,
  requirePermission(Permissions.ARTICLE_MANAGE),
  validateRequest({ body: impersonateBodySchema }),
  AdminAuthController.impersonate
);

export default router;
