import type { Request, Response, NextFunction } from 'express';
import { UploadPurposes, type UploadPurpose } from '../interfaces/Upload';
import { UploadService } from '../services/UploadService';

type UploadBody = { purpose?: string | null };
type FileRequest = Request & { file?: Express.Multer.File };

const getBody = <T>(req: Request) => (req.validated?.body ?? req.body) as T;
const getFile = (req: Request) => (req as FileRequest).file;

export const AuthorUploadController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const file = getFile(req);
      if (!file) return res.error(400, 'FILE_REQUIRED', 'File is required');

      const body = getBody<UploadBody>(req);
      const purpose =
        typeof body?.purpose === 'string' &&
        Object.values(UploadPurposes).includes(body.purpose as UploadPurpose)
          ? (body.purpose as UploadPurpose)
          : undefined;
      const result = await UploadService.uploadFile({
        uploadedBy: actorId,
        uploadedByRole: req.user?.role === 'admin' ? 'admin' : 'author',
        ...(purpose ? { purpose } : {}),
        file: {
          buffer: file.buffer,
          originalname: file.originalname,
          size: file.size,
        },
      });

      return res.success(result, 201);
    } catch (err) {
      next(err);
    }
  },
};
