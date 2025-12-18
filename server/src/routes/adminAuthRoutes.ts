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

router.post('/login', validateRequest({ body: loginBodySchema }), AdminAuthController.login);
router.get('/me', adminAuthMiddleware, AdminAuthController.me);

export default router;

