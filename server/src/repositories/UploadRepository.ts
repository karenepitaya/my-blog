import { Types } from 'mongoose';
import { UploadModel, type UploadDocument } from '../models/UploadModel';
import type { UploadPurpose } from '../interfaces/Upload';

export const UploadRepository = {
  async create(data: {
    url: string;
    storage: 'local' | 'oss' | 'minio';
    storageKey: string;
    fileName: string;
    mimeType: string;
    size: number;
    purpose: UploadPurpose;
    uploadedBy: string;
  }): Promise<UploadDocument> {
    const upload = new UploadModel({
      url: data.url,
      storage: data.storage,
      storageKey: data.storageKey,
      fileName: data.fileName,
      mimeType: data.mimeType,
      size: data.size,
      purpose: data.purpose,
      uploadedBy: new Types.ObjectId(data.uploadedBy),
    });

    return upload.save();
  },

  async findById(id: string): Promise<UploadDocument | null> {
    return UploadModel.findById(id).exec();
  },
};
