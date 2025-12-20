import type { Request, Response, NextFunction } from 'express';
import { UploadService } from '../services/UploadService';

export const AdminUploadController = {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user?.id;
      if (!actorId) return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) return res.error(400, 'FILE_REQUIRED', 'File is required');

      const body = ((req as any).validated?.body ?? req.body) as any;
      const result = await UploadService.uploadImage({
        uploadedBy: actorId,
        purpose: body?.purpose,
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

