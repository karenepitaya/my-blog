import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { UploadRepository } from '../repositories/UploadRepository';
import { UploadPurposes, type UploadPurpose, type UploadStorage } from '../interfaces/Upload';
import { SystemConfigService } from './SystemConfigService';
import { ObjectStorageService } from './ObjectStorageService';
import { sniffFileType, type FileCategory } from '../utils/fileType';

const DEFAULT_MAX_BYTES_BY_CATEGORY: Record<FileCategory, number> = {
  image: 5 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
};

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

function normalizePathSegment(input: string): string {
  return input.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '').replace(/\.\.+/g, '');
}

function resolveMaxBytes(category: FileCategory) {
  const fallback = DEFAULT_MAX_BYTES_BY_CATEGORY[category];
  const raw = Number(process.env.UPLOAD_MAX_BYTES ?? fallback);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

const PURPOSE_CATEGORY: Record<UploadPurpose, FileCategory | null> = {
  avatar: 'image',
  article_cover: 'image',
  favicon: 'image',
  ui_icon: 'image',
  audio: 'audio',
  video: 'video',
  misc: null,
};

const FRONTEND_PURPOSES = new Set<UploadPurpose>([
  UploadPurposes.AVATAR,
  UploadPurposes.ARTICLE_COVER,
  UploadPurposes.FAVICON,
]);

const ADMIN_PURPOSES = new Set<UploadPurpose>([UploadPurposes.UI_ICON]);

function resolvePurpose(input: UploadPurpose | undefined, category: FileCategory): UploadPurpose {
  if (!input) {
    if (category === 'audio') return UploadPurposes.AUDIO;
    if (category === 'video') return UploadPurposes.VIDEO;
    return UploadPurposes.MISC;
  }

  const expected = PURPOSE_CATEGORY[input];
  if (expected && expected !== category) {
    throw { status: 400, code: 'PURPOSE_MISMATCH', message: 'Upload purpose does not match file type' };
  }
  return input;
}

function resolveAppSegment(input: { purpose: UploadPurpose; role: 'admin' | 'author' }): string {
  if (FRONTEND_PURPOSES.has(input.purpose)) return 'blog';
  if (ADMIN_PURPOSES.has(input.purpose)) return 'admin';
  return input.role === 'admin' ? 'admin' : 'blog';
}

function buildFileName(input: { purpose: UploadPurpose; uploadedBy: string; ext: string }) {
  const unique = crypto.randomUUID();
  const stamp = Date.now();
  if (input.purpose === UploadPurposes.AVATAR) {
    return `${input.uploadedBy}-${stamp}-${unique.slice(0, 8)}.${input.ext}`;
  }
  if (input.purpose === UploadPurposes.FAVICON) {
    return `favicon-${stamp}-${unique.slice(0, 8)}.${input.ext}`;
  }
  return `${unique}.${input.ext}`;
}

function buildStorageKey(input: {
  app: string;
  category: FileCategory;
  purpose: UploadPurpose;
  fileName: string;
  uploadPath?: string;
}) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const segments = [
    normalizePathSegment(input.app),
    normalizePathSegment(input.category),
    normalizePathSegment(input.purpose),
    year,
    month,
    day,
    input.fileName,
  ].filter(Boolean);

  const baseKey = segments.join('/');
  const prefix = input.uploadPath ? normalizePathSegment(input.uploadPath) : '';
  return prefix ? `${prefix}/${baseKey}` : baseKey;
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
  async uploadFile(input: {
    uploadedBy: string;
    uploadedByRole: 'admin' | 'author';
    purpose?: UploadPurpose;
    file: { buffer: Buffer; originalname?: string; size: number };
  }) {
    const file = input.file;
    if (!file?.buffer || file.buffer.length === 0) {
      throw { status: 400, code: 'FILE_REQUIRED', message: 'File is required' };
    }

    const detected = sniffFileType(file.buffer);
    if (!detected) {
      throw { status: 400, code: 'UNSUPPORTED_FILE_TYPE', message: 'Unsupported file type' };
    }

    const maxBytes = resolveMaxBytes(detected.category);
    if (file.size > maxBytes) {
      throw { status: 413, code: 'FILE_TOO_LARGE', message: `File too large (max ${maxBytes} bytes)` };
    }

    const purpose = resolvePurpose(input.purpose, detected.category);
    const originalName = sanitizeFileName(file.originalname);

    const appSegment = resolveAppSegment({ purpose, role: input.uploadedByRole });
    const fileName = buildFileName({ purpose, uploadedBy: input.uploadedBy, ext: detected.ext });
    const { oss } = await SystemConfigService.get();
    const storageKey = buildStorageKey({
      app: appSegment,
      category: detected.category,
      purpose,
      fileName,
      uploadPath: oss?.uploadPath ?? undefined,
    });

    let url = '';
    let storage: UploadStorage = 'local';

    if (oss?.enabled) {
      if (!oss.endpoint || !oss.bucket || !oss.accessKey || !oss.secretKey) {
        throw { status: 500, code: 'OSS_CONFIG_MISSING', message: 'Object storage config is incomplete' };
      }
      const result = await ObjectStorageService.uploadBuffer({
        config: {
          provider: oss.provider,
          endpoint: oss.endpoint,
          bucket: oss.bucket,
          accessKey: oss.accessKey,
          secretKey: oss.secretKey,
          region: oss.region,
          customDomain: oss.customDomain,
        },
        key: storageKey,
        body: file.buffer,
        mimeType: detected.mimeType,
      });
      url = result.url;
      storage = oss.provider;
    } else {
      const uploadDirName = getUploadDirName();
      const uploadDirAbs = path.resolve(process.cwd(), uploadDirName);
      const absPath = path.join(uploadDirAbs, storageKey);
      await fs.mkdir(path.dirname(absPath), { recursive: true });
      await writeFileUnique(absPath, file.buffer);

      const baseUrl = getPublicBaseUrl();
      const urlPath = `/${uploadDirName}/${storageKey}`.replace(/\\/g, '/');
      url = baseUrl ? `${baseUrl}${urlPath}` : urlPath;
      storage = 'local';
    }

    const upload = await UploadRepository.create({
      url,
      storage,
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
