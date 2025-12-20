import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { UploadRepository } from '../repositories/UploadRepository';
import { UploadPurposes, type UploadPurpose } from '../interfaces/Upload';
import { sniffImageType } from '../utils/imageType';

const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function getUploadDirName(): string {
  const dir = String(process.env.UPLOAD_DIR ?? '').trim();
  return dir ? dir : 'uploads';
}

function getPublicBaseUrl(): string | null {
  const raw = String(process.env.PUBLIC_BASE_URL ?? '').trim();
  if (!raw) return null;
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function sanitizeFileName(input: unknown): string {
  const raw = String(input ?? '').trim();
  const base = path.basename(raw || 'upload');
  return base.slice(0, 255) || 'upload';
}

async function writeFileUnique(absPath: string, data: Buffer, retries = 3): Promise<void> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await fs.writeFile(absPath, data, { flag: 'wx' });
      return;
    } catch (err: any) {
      if (err?.code !== 'EEXIST' || attempt === retries - 1) throw err;
    }
  }
}

function toDto(upload: any) {
  return {
    id: String(upload._id),
    url: upload.url,
    storage: upload.storage,
    storageKey: upload.storageKey,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    size: upload.size,
    purpose: upload.purpose,
    uploadedBy: upload.uploadedBy ? String(upload.uploadedBy) : null,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}

export const UploadService = {
  async uploadImage(input: {
    uploadedBy: string;
    purpose?: UploadPurpose;
    file: { buffer: Buffer; originalname?: string; size: number };
  }) {
    const maxBytes = Number(process.env.UPLOAD_MAX_BYTES ?? DEFAULT_MAX_FILE_SIZE_BYTES);
    const safeMaxBytes = Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : DEFAULT_MAX_FILE_SIZE_BYTES;

    const file = input.file;
    if (!file?.buffer || file.buffer.length === 0) {
      throw { status: 400, code: 'FILE_REQUIRED', message: 'File is required' };
    }

    if (file.size > safeMaxBytes) {
      throw { status: 413, code: 'FILE_TOO_LARGE', message: `File too large (max ${safeMaxBytes} bytes)` };
    }

    const detected = sniffImageType(file.buffer);
    if (!detected) {
      throw { status: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Only jpg/png/gif/webp images are supported' };
    }

    const purpose = input.purpose ?? UploadPurposes.MISC;
    const originalName = sanitizeFileName(file.originalname);

    const uploadDirName = getUploadDirName();
    const uploadDirAbs = path.resolve(process.cwd(), uploadDirName);

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const fileId = crypto.randomUUID();
    const storageKey = `${year}/${month}/${day}/${fileId}.${detected.ext}`;

    const absPath = path.join(uploadDirAbs, storageKey);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    await writeFileUnique(absPath, file.buffer);

    const baseUrl = getPublicBaseUrl();
    const urlPath = `/${uploadDirName}/${storageKey}`.replace(/\\/g, '/');
    const url = baseUrl ? `${baseUrl}${urlPath}` : urlPath;

    const upload = await UploadRepository.create({
      url,
      storageKey,
      fileName: originalName,
      mimeType: detected.mimeType,
      size: file.size,
      purpose,
      uploadedBy: input.uploadedBy,
    });

    return toDto(upload);
  },
};

