import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';
import { AuthorProfileController } from '../controllers/AuthorProfileController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requireRole(['author']));

const nullableText = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().max(max), z.null()]).optional()
  );

const updateBodySchema = z
  .object({
    avatarUrl: nullableText(2048),
    bio: nullableText(500),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny = data.avatarUrl !== undefined || data.bio !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No update fields provided' });
    }
  });

const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(6).max(100),
  })
  .strict();

router.get('/', AuthorProfileController.me);
router.patch('/', validateRequest({ body: updateBodySchema }), AuthorProfileController.update);
router.put(
  '/password',
  validateRequest({ body: changePasswordBodySchema }),
  AuthorProfileController.changePassword
);

export default router;

