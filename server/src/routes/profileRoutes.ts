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

const nullableEmail = (max: number) =>
  z.preprocess(
    value => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.union([z.string().trim().email().max(max), z.null()]).optional()
  );

const updateBodySchema = z
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

const changePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1).max(100),
    newPassword: z.string().min(6).max(100),
  })
  .strict();

const aiConfigBodySchema = z
  .object({
    vendorId: nullableText(50),
    apiKey: nullableText(200),
    baseUrl: nullableText(2048),
    model: nullableText(200),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasAny =
      data.vendorId !== undefined ||
      data.apiKey !== undefined ||
      data.baseUrl !== undefined ||
      data.model !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'No update fields provided' });
    }
  });

const aiModelsBodySchema = z
  .object({
    vendorId: nullableText(50),
    apiKey: nullableText(200),
    baseUrl: nullableText(2048),
  })
  .strict();

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    value => {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    },
    z.number().min(min).max(max).optional()
  );

const aiProxyMessageSchema = z
  .object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string().trim().min(1).max(20000),
  })
  .strict();

const aiProxyBodySchema = z
  .object({
    vendorId: nullableText(50),
    apiKey: nullableText(200),
    baseUrl: nullableText(2048),
    model: nullableText(200),
    prompt: z.string().trim().min(1).max(20000).optional(),
    messages: z.array(aiProxyMessageSchema).min(1).optional(),
    temperature: optionalNumber(0, 2),
    responseFormat: z.enum(['json_object', 'text']).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const hasPrompt = typeof data.prompt === 'string' && data.prompt.trim().length > 0;
    const hasMessages = Array.isArray(data.messages) && data.messages.length > 0;
    if (!hasPrompt && !hasMessages) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prompt or messages required' });
    }
  });

router.get('/', AuthorProfileController.me);
router.patch('/', validateRequest({ body: updateBodySchema }), AuthorProfileController.update);
router.patch(
  '/ai-config',
  validateRequest({ body: aiConfigBodySchema }),
  AuthorProfileController.updateAiConfig
);
router.post(
  '/ai-config/models',
  validateRequest({ body: aiModelsBodySchema }),
  AuthorProfileController.fetchAiModels
);
router.post(
  '/ai-config/proxy',
  validateRequest({ body: aiProxyBodySchema }),
  AuthorProfileController.proxyAiRequest
);
router.put(
  '/password',
  validateRequest({ body: changePasswordBodySchema }),
  AuthorProfileController.changePassword
);

export default router;
