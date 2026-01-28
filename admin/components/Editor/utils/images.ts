import type { UploadResult } from '../../../services/upload';
import type { CachedAsset } from '../cache';
import type { ProcessingError } from '../types';

export const DEFAULT_IMAGE_QUALITY = 0.8;
const MAX_IMAGE_WIDTH = 1920;
const MD_IMAGE_REGEX = /!\[(.*?)\]\((.*?)\)/g;
const HTML_IMAGE_REGEX = /<img[\s\S]*?src=["'](.*?)["'][\s\S]*?>/g;

const stripQueryHash = (value: string) => value.split(/[?#]/)[0];

const normalizeFileName = (value: string) => {
  const clean = stripQueryHash(value).replace(/\\/g, '/').trim().replace(/^<|>$/g, '');
  return clean.split('/').pop()?.toLowerCase() ?? '';
};

export const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('/');
export const isDataImageUrl = (value: string) => value.startsWith('data:image');

export const extractImageUrls = (markdown: string) => {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  MD_IMAGE_REGEX.lastIndex = 0;
  HTML_IMAGE_REGEX.lastIndex = 0;
  while ((match = MD_IMAGE_REGEX.exec(markdown)) !== null) {
    const raw = match[2]?.trim();
    if (!raw) continue;
    const url = raw.split(/\s+/)[0].replace(/^<|>$/g, '');
    if (url) results.push(url);
  }
  while ((match = HTML_IMAGE_REGEX.exec(markdown)) !== null) {
    const raw = match[1]?.trim();
    if (raw) results.push(raw);
  }
  return Array.from(new Set(results));
};

export const getLocalImageUrls = (markdown: string) =>
  extractImageUrls(markdown).filter(url => !isRemoteUrl(url) && !isDataImageUrl(url));

export const buildUploadFileName = (url: string, mimeType?: string) => {
  const originalName = stripQueryHash(url).replace(/\\/g, '/').split('/').pop() ?? '';
  const extFromMime = mimeType?.split('/')[1];
  const hasExt = originalName.includes('.');
  const base = hasExt ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName || 'image';
  const ext = extFromMime ?? (hasExt ? originalName.split('.').pop() : 'jpg');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${Date.now()}-${suffix}.${ext || extFromMime}`;
};

export const compressImage = async (blob: Blob, quality: number) => {
  if (!blob.type.startsWith('image/') || blob.type === 'image/gif') return blob;
  return new Promise<Blob>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_IMAGE_WIDTH) {
        height = Math.round((height * MAX_IMAGE_WIDTH) / width);
        width = MAX_IMAGE_WIDTH;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        newBlob => {
          if (newBlob) resolve(newBlob);
          else resolve(blob);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = err => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
};

export const collectReferencedUploadIds = (
  markdown: string,
  uploadedAssets: Record<string, string>,
  coverUploadId: string | null
) => {
  const urls = extractImageUrls(markdown);
  const ids = new Set<string>();
  urls.forEach(url => {
    const mapped = uploadedAssets[url];
    if (mapped) ids.add(mapped);
  });
  if (coverUploadId) ids.add(coverUploadId);
  return Array.from(ids);
};

const findMatchingFile = (url: string, files: File[]) => {
  const target = normalizeFileName(url);
  if (!target) return undefined;
  return files.find(file => {
    const candidate = normalizeFileName(file.webkitRelativePath || file.name);
    return candidate === target;
  });
};

export const buildLocalAssetsFromFiles = (urls: string[], files: File[]) => {
  const assets: Record<string, CachedAsset> = {};
  const missing: string[] = [];
  urls.forEach(url => {
    const match = findMatchingFile(url, files);
    if (!match) {
      missing.push(url);
      return;
    }
    assets[url] = {
      blob: match,
      name: match.name,
      type: match.type,
      size: match.size,
      lastModified: match.lastModified,
    };
  });
  return { assets, missing };
};

export const resolveLocalAsset = (url: string, localAssets: Record<string, CachedAsset>) => {
  const direct = localAssets[url];
  if (direct) return direct;
  const target = normalizeFileName(url);
  if (!target) return undefined;
  const entry = Object.entries(localAssets).find(([key]) => normalizeFileName(key) === target);
  return entry ? entry[1] : undefined;
};

export const hasLocalAsset = (url: string, localAssets: Record<string, CachedAsset>) =>
  Boolean(resolveLocalAsset(url, localAssets));

export const processMarkdownImages = async (
  markdown: string,
  localAssets: Record<string, CachedAsset>,
  uploadInline: (file: File) => Promise<UploadResult>,
  compressionQuality: number
) => {
  const urls = extractImageUrls(markdown);
  const errors: ProcessingError[] = [];
  const missingLocalPaths: string[] = [];
  if (urls.length === 0) {
    return { content: markdown, errors, missingLocalPaths, processedCount: 0, uploadedAssets: {} };
  }

  const localUrls = getLocalImageUrls(markdown);
  if (localUrls.length > 0) {
    localUrls.forEach(url => {
      if (!hasLocalAsset(url, localAssets)) {
        missingLocalPaths.push(url);
        errors.push({ path: url, reason: '缓存中未找到本地资源', isLocalMissing: true });
      }
    });

    if (missingLocalPaths.length > 0) {
      return { content: markdown, errors, missingLocalPaths, processedCount: 0, uploadedAssets: {} };
    }
  }

  const uploadedAssets: Record<string, string> = {};
  let updatedContent = markdown;

  for (const url of urls) {
    if (isRemoteUrl(url)) continue;

    try {
      let blob: Blob | null = null;
      if (isDataImageUrl(url)) {
        const res = await fetch(url);
        blob = await res.blob();
      } else {
        const asset = resolveLocalAsset(url, localAssets);
        if (asset) blob = asset.blob;
      }

      if (!blob) {
        errors.push({ path: url, reason: '缓存中未找到本地资源', isLocalMissing: true });
        continue;
      }

      const shouldCompress = Number.isFinite(compressionQuality) && compressionQuality < 0.999;
      const payloadBlob = shouldCompress ? await compressImage(blob, compressionQuality) : blob;
      const filename = buildUploadFileName(url, payloadBlob.type || blob.type);
      const uploadFile = new File([payloadBlob], filename, {
        type: payloadBlob.type || blob.type || 'application/octet-stream',
      });
      const result = await uploadInline(uploadFile);
      uploadedAssets[result.url] = result.id;
      updatedContent = updatedContent.split(url).join(result.url);
    } catch (err) {
      errors.push({ path: url, reason: (err as Error).message });
    }
  }

  return {
    content: updatedContent,
    errors,
    missingLocalPaths,
    processedCount: Object.keys(uploadedAssets).length,
    uploadedAssets,
  };
};
