import { Router, type Router as ExpressRouter, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminUploadController } from '../controllers/AdminUploadController';

const router: ExpressRouter = Router();

router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.SYSTEM_CONFIG));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024),
  },
});

type MulterErrorLike = {
  name?: string;
  code?: string;
  message?: string;
};

const isMulterError = (err: unknown): err is MulterErrorLike =>
  typeof err === 'object' && err !== null && (err as MulterErrorLike).name === 'MulterError';

function uploadSingle(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (!err) return next();

      if (isMulterError(err)) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.error(413, 'FILE_TOO_LARGE', 'File too large');
        }
        return res.error(400, 'UPLOAD_ERROR', err.message ?? 'Upload failed');
      }

      return next(err);
    });
  };
}

const bodySchema = z
  .object({
    purpose: z
      .enum(['avatar', 'article_cover', 'category_cover', 'favicon', 'character_avatar', 'ui_icon', 'audio', 'video', 'misc'])
      .optional(),
  })
  .strict();

router.post('/', uploadSingle('file'), validateRequest({ body: bodySchema }), AdminUploadController.upload);

export default router;
