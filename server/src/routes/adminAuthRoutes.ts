import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';

const router: ExpressRouter = Router();

const loginBodySchema = z
  .object({
    username: z.string().trim().min(3).max(30),
    password: z.string().min(6).max(100),
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

export default router;
