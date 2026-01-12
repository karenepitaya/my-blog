import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireRole } from '../middlewares/roleMiddleware';
import { validateRequest } from '../middlewares/validation';
import { AuthorUploadController } from '../controllers/AuthorUploadController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.use(requireRole(['author']));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 1,
    fileSize: Number(process.env.UPLOAD_MAX_BYTES ?? 5 * 1024 * 1024),
  },
});

function uploadSingle(fieldName: string) {
  return (req: any, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (!err) return next();

      if (err?.name === 'MulterError') {
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
      .enum(['avatar', 'article_cover', 'category_cover', 'favicon', 'ui_icon', 'audio', 'video', 'misc'])
      .optional(),
  })
  .strict();

router.post('/', uploadSingle('file'), validateRequest({ body: bodySchema }), AuthorUploadController.upload);

export default router;
