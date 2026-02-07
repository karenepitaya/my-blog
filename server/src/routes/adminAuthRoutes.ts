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

const nullableText = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().max(max), z.null()]).optional()
  );

const nullableEmail = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().email().max(max), z.null()]).optional()
  );

const updateMeBodySchema = z
  .object({
    avatarUrl: nullableText(2048),
    bio: nullableText(500),
    displayName: nullableText(80),
    email: nullableEmail(200),
    roleTitle: nullableText(120),
    emojiStatus: nullableText(16),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny =
      data.avatarUrl !== undefined ||
      data.bio !== undefined ||
      data.displayName !== undefined ||
      data.email !== undefined ||
      data.roleTitle !== undefined ||
      data.emojiStatus !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No update fields provided' });
    }
  });

router.post('/login', validateRequest({ body: loginBodySchema }), AdminAuthController.login);
router.post('/logout', AdminAuthController.logout);
router.get('/me', adminAuthMiddleware, AdminAuthController.me);
router.patch(
  '/me',
  adminAuthMiddleware,
  validateRequest({ body: updateMeBodySchema }),
  AdminAuthController.updateMe
);
router.post(
  '/impersonate',
  adminAuthMiddleware,
  requirePermission(Permissions.ARTICLE_MANAGE),
  validateRequest({ body: impersonateBodySchema }),
  AdminAuthController.impersonate
);
router.post('/exit-impersonation', adminAuthMiddleware, AdminAuthController.exitImpersonation);

export default router;
