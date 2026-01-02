import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ConfirmModal from '../ConfirmModal';
import { Article, Category, ArticleStatus } from '../../types';
import type { UploadResult } from '../../services/upload';
import { clearDraft, loadDraft, saveDraft, type EditorCacheRecord, type CachedAsset } from './cache';

// --- Icons ---
const DatabaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
  </svg>
);
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const EyeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const EyeSlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-[#50fa7b]" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-[#bd93f9]" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);
const DEFAULT_IMAGE_QUALITY = 0.8;
const MAX_IMAGE_WIDTH = 1920;
const MD_IMAGE_REGEX = /!\[(.*?)\]\((.*?)\)/g;
const HTML_IMAGE_REGEX = /<img[\s\S]*?src=["'](.*?)["'][\s\S]*?>/g;
const CACHE_SCHEMA_VERSION = 1;

export type EditorSavePayload = {
  id?: string;
  status: ArticleStatus;
  title: string;
  markdown: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  tags: string[];
  categoryId?: string | null;
  slug?: string | null;
  uploadIds?: string[];
};

type AiProxyMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AiProxyInput = {
  prompt?: string;
  messages?: AiProxyMessage[];
  temperature?: number;
  responseFormat?: 'json_object' | 'text';
};

interface EditorPageProps {
  article?: Article | null;
  categories: Category[];
  defaultCategoryId?: string;
  aiEnabled: boolean;
  isAuthor: boolean;
  aiConfigured: boolean;
  aiModelName?: string;
  autoSaveInterval: number;
  imageCompressionQuality?: number;
  onBack: () => void;
  onProxyAiRequest: (input: AiProxyInput) => Promise<{ content: string }>;
  onUploadCover: (file: File) => Promise<UploadResult>;
  onUploadInlineImage: (file: File) => Promise<UploadResult>;
  onSaveToDb: (payload: EditorSavePayload) => Promise<Article>;
}

// Define the shape of the AI analysis result
interface AiAnalysisResult {
  title: string;
  summary: string;
  tags: string[];
  suggestedSlug: string;
  readingTimeMinutes: number;
}

type ProcessingState =
  | 'IDLE'
  | 'PROCESSING_IMAGES'
  | 'WAITING_FOR_ASSETS'
  | 'SAVING_DRAFT'
  | 'SAVING_PUBLISH'
  | 'ANALYZING'
  | 'COMPLETE'
  | 'ERROR';

type ProcessingError = {
  path: string;
  reason: string;
  isLocalMissing?: boolean;
};

const stripQueryHash = (value: string) => value.split(/[?#]/)[0];

const normalizeFileName = (value: string) => {
  const clean = stripQueryHash(value).replace(/\\/g, '/').trim().replace(/^<|>$/g, '');
  return clean.split('/').pop()?.toLowerCase() ?? '';
};

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('/');
const isDataImageUrl = (value: string) => value.startsWith('data:image');

const extractImageUrls = (markdown: string) => {
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

const getLocalImageUrls = (markdown: string) =>
  extractImageUrls(markdown).filter(url => !isRemoteUrl(url) && !isDataImageUrl(url));

const allowAllUris = (uri: string) => uri;

const parseAiJson = (text: string): AiAnalysisResult => {
  let cleanText = text;
  cleanText = cleanText.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleanText = cleanText.replace(/```json\n?|\n?```/g, '');
  cleanText = cleanText.replace(/```\n?|\n?```/g, '');
  cleanText = cleanText.trim();
  try {
    return JSON.parse(cleanText) as AiAnalysisResult;
  } catch (err) {
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]) as AiAnalysisResult;
    }
  }
  throw new Error('AI_JSON_PARSE_FAILED');
};

const buildUploadFileName = (url: string, mimeType?: string) => {
  const originalName = stripQueryHash(url).replace(/\\/g, '/').split('/').pop() ?? '';
  const extFromMime = mimeType?.split('/')[1];
  const hasExt = originalName.includes('.');
  const base = hasExt ? originalName.slice(0, originalName.lastIndexOf('.')) : originalName || 'image';
  const ext = extFromMime ?? (hasExt ? originalName.split('.').pop() : 'jpg');
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${Date.now()}-${suffix}.${ext || extFromMime}`;
};

const compressImage = async (blob: Blob, quality: number) => {
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

const collectReferencedUploadIds = (
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

interface ProcessingOverlayProps {
  state: ProcessingState;
  errors: ProcessingError[];
  missingPaths: string[];
  onClose: () => void;
  onUploadFolder: (files: FileList) => void;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  state,
  errors,
  missingPaths,
  onClose,
  onUploadFolder,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isVisible = state !== 'IDLE';
  const isProcessing = state === 'PROCESSING_IMAGES' || state === 'SAVING_DRAFT' || state === 'SAVING_PUBLISH';
  const isWaiting = state === 'WAITING_FOR_ASSETS';
  const isError = state === 'ERROR';
  const isComplete = state === 'COMPLETE';
  const hasErrors = errors.length > 0;

  const ensureFolderInputAttributes = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.setAttribute('webkitdirectory', '');
    fileInputRef.current.setAttribute('directory', '');
    fileInputRef.current.setAttribute('mozdirectory', '');
    fileInputRef.current.setAttribute('msdirectory', '');
    fileInputRef.current.setAttribute('odirectory', '');
  };

  useEffect(() => {
    ensureFolderInputAttributes();
  }, []);

  useEffect(() => {
    if (isComplete && !hasErrors) {
      const timer = setTimeout(onClose, 900);
      return () => clearTimeout(timer);
    }
  }, [hasErrors, isComplete, onClose]);

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    onUploadFolder(files);
  };

  const openFolderDialog = () => {
    if (!fileInputRef.current) return;
    ensureFolderInputAttributes();
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  let message = '正在处理...';
  if (state === 'PROCESSING_IMAGES') message = '正在处理图片资源...';
  if (state === 'SAVING_DRAFT') message = '正在保存草稿...';
  if (state === 'SAVING_PUBLISH') message = '正在发布文章...';

  if (!isVisible) return null;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={handleFolderSelect}
      />
      <div className="fixed inset-0 z-[120] backdrop-blur-md bg-[#282a36]/70 flex items-center justify-center p-6">
        <div className="bg-[#44475a] border border-[#6272a4] rounded-2xl shadow-2xl p-8 max-w-xl w-full text-center">
          {isProcessing && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#bd93f9]/30 border-t-[#bd93f9] rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-[#f8f8f2]">{message}</h3>
              <p className="text-xs text-[#6272a4]">请勿关闭页面</p>
            </div>
          )}

          {isWaiting && (
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[#bd93f9]/10 rounded-full border border-[#bd93f9]/30">
                <FolderIcon />
              </div>
              <h3 className="text-lg font-bold text-[#f8f8f2]">需要补齐本地图片</h3>
              <p className="text-xs text-[#6272a4]">
                检测到 Markdown 引用了本地文件，请选择对应的图片目录继续上传。
              </p>
              <div className="w-full text-left bg-[#282a36] rounded-lg p-3 text-xs max-h-36 overflow-y-auto font-mono text-[#ffb86c] border border-[#6272a4]">
                {missingPaths.map((path, index) => (
                  <div key={`${path}-${index}`}>{path}</div>
                ))}
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-[#282a36] text-[#f8f8f2] rounded-lg border border-[#6272a4] hover:bg-[#6272a4]"
                >
                  取消保存
                </button>
                <button
                  onClick={openFolderDialog}
                  className="flex-1 py-2 bg-[#bd93f9] text-[#282a36] font-bold rounded-lg hover:bg-[#ff79c6]"
                >
                  选择文件夹
                </button>
              </div>
            </div>
          )}

          {isError && (
            <div className="text-left">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[#ffb86c] text-lg font-black">处理失败</span>
              </div>
              {hasErrors && (
                <div className="bg-[#282a36] rounded-md border border-[#ff5555]/50 p-4 max-h-60 overflow-y-auto mb-6">
                  {errors.map((err, index) => (
                    <div key={`${err.path}-${index}`} className="mb-2 last:mb-0 text-sm">
                      <p className="text-[#ff5555] font-mono break-all">{err.path}</p>
                      <p className="text-[#6272a4] text-xs mt-0.5">{err.reason}</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#ff5555] text-white rounded font-bold hover:bg-[#ff6e6e]"
              >
                关闭
              </button>
            </div>
          )}

          {isComplete && !hasErrors && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircleIcon />
              <h3 className="text-lg font-bold text-[#f8f8f2]">保存成功</h3>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const findMatchingFile = (url: string, files: File[]) => {
  const target = normalizeFileName(url);
  if (!target) return undefined;
  return files.find(file => {
    const candidate = normalizeFileName(file.webkitRelativePath || file.name);
    return candidate === target;
  });
};

const buildLocalAssetsFromFiles = (urls: string[], files: File[]) => {
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

const resolveLocalAsset = (url: string, localAssets: Record<string, CachedAsset>) => {
  const direct = localAssets[url];
  if (direct) return direct;
  const target = normalizeFileName(url);
  if (!target) return undefined;
  const entry = Object.entries(localAssets).find(([key]) => normalizeFileName(key) === target);
  return entry ? entry[1] : undefined;
};

const hasLocalAsset = (url: string, localAssets: Record<string, CachedAsset>) =>
  Boolean(resolveLocalAsset(url, localAssets));

const processMarkdownImages = async (
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

      const compressed = await compressImage(blob, compressionQuality);
      const filename = buildUploadFileName(url, compressed.type || blob.type);
      const uploadFile = new File([compressed], filename, {
        type: compressed.type || blob.type || 'image/jpeg',
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
export default function EditorPage({
  article,
  categories,
  defaultCategoryId,
  aiEnabled,
  isAuthor,
  aiConfigured,
  aiModelName,
  autoSaveInterval,
  imageCompressionQuality,
  onBack,
  onProxyAiRequest,
  onUploadCover,
  onUploadInlineImage,
  onSaveToDb,
}: EditorPageProps) {
  const cacheKey = useMemo(() => `editor:draft:${article?.id ?? 'new'}`, [article?.id]);
  const [content, setContent] = useState(article?.markdown || '');
  const [title, setTitle] = useState(article?.title || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [slug, setSlug] = useState(article?.slug || '');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [readingTimeMinutes, setReadingTimeMinutes] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? defaultCategoryId ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl ?? '');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(article?.coverImageUrl ?? '');
  const [coverUploadId, setCoverUploadId] = useState<string | null>(null);
  const [coverLocalAsset, setCoverLocalAsset] = useState<CachedAsset | null>(null);
  const [uploadedAssets, setUploadedAssets] = useState<Record<string, string>>({});
  const [localAssets, setLocalAssets] = useState<Record<string, CachedAsset>>({});
  const [newTagInput, setNewTagInput] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [processingState, setProcessingState] = useState<ProcessingState>('IDLE');
  const [processingErrors, setProcessingErrors] = useState<ProcessingError[]>([]);
  const [missingLocalPaths, setMissingLocalPaths] = useState<string[]>([]);
  const [isCacheReady, setIsCacheReady] = useState(false);
  const [lastCachedAt, setLastCachedAt] = useState<Date | null>(null);
  const [lastDbSavedAt, setLastDbSavedAt] = useState<Date | null>(null);
  const [isRestorePromptOpen, setIsRestorePromptOpen] = useState(false);
  const [pendingCache, setPendingCache] = useState<EditorCacheRecord | null>(null);
  const [isAiConfirmOpen, setIsAiConfirmOpen] = useState(false);
  const [isBackConfirmOpen, setIsBackConfirmOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const uploadedAssetsRef = useRef<Record<string, string>>({});
  const localAssetsRef = useRef<Record<string, CachedAsset>>({});
  const previewAssetUrlsRef = useRef<Record<string, string>>({});
  const pendingAssetActionRef = useRef<'CACHE_SAVE' | 'PREVIEW' | null>(null);
  const pendingLocalPathsRef = useRef<string[]>([]);
  const coverBlobUrlRef = useRef<string | null>(null);
  const articleIdRef = useRef<string | null>(null);

  const aiReady = aiEnabled && isAuthor && aiConfigured;

  useEffect(() => {
    uploadedAssetsRef.current = uploadedAssets;
  }, [uploadedAssets]);

  useEffect(() => {
    localAssetsRef.current = localAssets;
  }, [localAssets]);

  useEffect(() => {
    const nextId = article?.id ?? 'new';
    if (articleIdRef.current === nextId) return;
    articleIdRef.current = nextId;
    setContent(article?.markdown ?? '');
    setTitle(article?.title ?? '');
    setSummary(article?.summary ?? '');
    setSlug(article?.slug ?? '');
    setTags(article?.tags ?? []);
    setReadingTimeMinutes(null);
    setCategoryId(article?.categoryId ?? defaultCategoryId ?? '');
    setCoverImageUrl(article?.coverImageUrl ?? '');
    setCoverPreviewUrl(article?.coverImageUrl ?? '');
    setCoverUploadId(null);
    setCoverLocalAsset(null);
    setUploadedAssets({});
    setLocalAssets({});
    setPreviewContent('');
    setIsDirty(false);
    setIsCacheReady(false);
    setLastCachedAt(null);
    setLastDbSavedAt(null);
    setAiError('');
    setProcessingErrors([]);
    setMissingLocalPaths([]);
    setProcessingState('IDLE');
  }, [article?.id, defaultCategoryId, article?.categoryId, article?.coverImageUrl, article?.markdown, article?.slug, article?.summary, article?.tags, article?.title]);

  useEffect(() => {
    let active = true;
    loadDraft(cacheKey)
      .then(draft => {
        if (!active) return;
        if (draft) {
          setPendingCache(draft);
          setIsRestorePromptOpen(true);
        } else {
          setPendingCache(null);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [cacheKey]);

  useEffect(() => {
    if (coverLocalAsset) return;
    if (!isUploadingCover) {
      setCoverPreviewUrl(coverImageUrl);
    }
  }, [coverImageUrl, isUploadingCover, coverLocalAsset]);

  useEffect(() => {
    if (!coverLocalAsset) return;
    if (coverBlobUrlRef.current) {
      URL.revokeObjectURL(coverBlobUrlRef.current);
    }
    const blobUrl = URL.createObjectURL(coverLocalAsset.blob);
    coverBlobUrlRef.current = blobUrl;
    setCoverPreviewUrl(blobUrl);
    return () => {
      if (coverBlobUrlRef.current === blobUrl) {
        URL.revokeObjectURL(blobUrl);
        coverBlobUrlRef.current = null;
      }
    };
  }, [coverLocalAsset]);

  useEffect(() => {
    return () => {
      if (coverBlobUrlRef.current) {
        URL.revokeObjectURL(coverBlobUrlRef.current);
      }
    };
  }, []);

  function revokePreviewUrls() {
    Object.values(previewAssetUrlsRef.current).forEach(url => {
      URL.revokeObjectURL(url);
    });
    previewAssetUrlsRef.current = {};
  }

  useEffect(() => {
    return () => {
      revokePreviewUrls();
    };
  }, []);

  useEffect(() => {
    if (!isCacheReady) setIsPreviewMode(false);
  }, [isCacheReady]);

  useEffect(() => {
    if (isPreviewMode) return;
    revokePreviewUrls();
    setPreviewContent('');
  }, [isPreviewMode]);

  useEffect(() => {
    if (!isPreviewMode) return;
    revokePreviewUrls();
    let updated = content;
    const urls = extractImageUrls(content);
    urls.forEach(url => {
      if (isRemoteUrl(url) || isDataImageUrl(url)) return;
      const asset = resolveLocalAsset(url, localAssetsRef.current);
      if (!asset) return;
      const objectUrl = URL.createObjectURL(asset.blob);
      previewAssetUrlsRef.current[url] = objectUrl;
      updated = updated.split(url).join(objectUrl);
    });
    setPreviewContent(updated);
  }, [content, isPreviewMode, localAssets]);

  const compressionQuality = Math.min(
    1,
    Math.max(0.1, typeof imageCompressionQuality === 'number' ? imageCompressionQuality : DEFAULT_IMAGE_QUALITY)
  );

  const requestLocalAssets = (paths: string[], action: 'CACHE_SAVE' | 'PREVIEW') => {
    const uniquePaths = Array.from(new Set(paths));
    if (uniquePaths.length === 0) return false;
    pendingAssetActionRef.current = action;
    pendingLocalPathsRef.current = uniquePaths;
    setMissingLocalPaths(uniquePaths);
    setProcessingErrors([]);
    setProcessingState('WAITING_FOR_ASSETS');
    return true;
  };

  const persistCache = useCallback(async (overrideLocalAssets?: Record<string, CachedAsset>) => {
    const localAssetsSnapshot = overrideLocalAssets ?? localAssetsRef.current;
    const record: EditorCacheRecord = {
      id: cacheKey,
      schemaVersion: CACHE_SCHEMA_VERSION,
      updatedAt: Date.now(),
      articleId: article?.id ?? null,
      title: title.trim(),
      summary: summary.trim(),
      slug: slug.trim(),
      tags: tags.map(tag => tag.trim()).filter(Boolean),
      categoryId: categoryId ? categoryId : null,
      coverImageUrl: coverImageUrl ? coverImageUrl : null,
      coverUploadId: coverUploadId ?? null,
      coverAsset: coverLocalAsset ?? null,
      readingTimeMinutes: readingTimeMinutes ?? null,
      content,
      uploadedAssets: uploadedAssetsRef.current,
      localAssets: localAssetsSnapshot,
    };
    await saveDraft(record);
    setIsCacheReady(true);
    setLastCachedAt(new Date(record.updatedAt));
    setIsDirty(false);
  }, [cacheKey, article?.id, title, summary, slug, tags, categoryId, coverImageUrl, coverUploadId, coverLocalAsset, readingTimeMinutes, content]);

  useEffect(() => {
    if (!autoSaveInterval || autoSaveInterval <= 0) return;
    const intervalMs = autoSaveInterval * 1000;
    const timer = setInterval(() => {
      if (!isDirty) return;
      persistCache().catch(() => {});
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoSaveInterval, isDirty, persistCache]);

  const handleCacheSave = async () => {
    const localUrls = getLocalImageUrls(content);
    const missingPaths = localUrls.filter(url => !hasLocalAsset(url, localAssetsRef.current));
    if (requestLocalAssets(missingPaths, 'CACHE_SAVE')) return;
    try {
      await persistCache();
    } catch (err) {
      alert((err as Error).message || '缓存保存失败');
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewMode) {
      setIsPreviewMode(false);
      return;
    }
    const localUrls = getLocalImageUrls(content);
    const missingPaths = localUrls.filter(url => !hasLocalAsset(url, localAssetsRef.current));
    if (requestLocalAssets(missingPaths, 'PREVIEW')) return;
    setIsPreviewMode(true);
  };

  const handleApplyCache = async () => {
    if (!pendingCache) return;
    setContent(pendingCache.content ?? '');
    setTitle(pendingCache.title ?? '');
    setSummary(pendingCache.summary ?? '');
    setSlug(pendingCache.slug ?? '');
    setTags(pendingCache.tags ?? []);
    setReadingTimeMinutes(pendingCache.readingTimeMinutes ?? null);
    setCategoryId(pendingCache.categoryId ?? '');
    setCoverImageUrl(pendingCache.coverImageUrl ?? '');
    setCoverPreviewUrl(pendingCache.coverImageUrl ?? '');
    setCoverUploadId(pendingCache.coverUploadId ?? null);
    setCoverLocalAsset(pendingCache.coverAsset ?? null);
    setUploadedAssets(pendingCache.uploadedAssets ?? {});
    setLocalAssets(pendingCache.localAssets ?? {});
    setIsCacheReady(true);
    setLastCachedAt(new Date(pendingCache.updatedAt));
    setIsDirty(false);
    setPendingCache(null);
    setIsRestorePromptOpen(false);
  };

  const handleDiscardCache = async () => {
    try {
      await clearDraft(cacheKey);
    } catch (err) {
      // Ignore cleanup errors.
    }
    setLocalAssets({});
    setCoverLocalAsset(null);
    setIsCacheReady(false);
    setLastCachedAt(null);
    setPendingCache(null);
    setIsRestorePromptOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setContent(event.target.result);
        setIsDirty(true);
      }
    };
    reader.readAsText(file);
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploadError('');
    setCoverLocalAsset({
      blob: file,
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    });
    setCoverImageUrl('');
    setCoverUploadId(null);
    setIsDirty(true);
  };

  const handleClearCover = () => {
    setCoverImageUrl('');
    setCoverUploadId(null);
    setCoverLocalAsset(null);
    setCoverPreviewUrl('');
    setIsDirty(true);
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
    setIsDirty(true);
  };

  const handleAddTag = () => {
    if (!newTagInput.trim()) return;
    const value = newTagInput.trim();
    if (!tags.includes(value)) {
      setTags([...tags, value]);
      setIsDirty(true);
    }
    setNewTagInput('');
  };

  const handleAnalyze = async () => {
    if (!aiEnabled) {
      alert('AI 助手已关闭，请联系管理员开启。');
      return;
    }
    if (!isAuthor) {
      alert('AI 分析仅作者可用。');
      return;
    }
    if (!aiConfigured) {
      alert('请先在个人设置中完成 AI 配置。');
      return;
    }
    setIsAiLoading(true);
    setAiError('');
    try {
      const cached = await loadDraft(cacheKey);
      if (!cached?.content) {
        throw new Error('请先保存到缓存再进行 AI 分析。');
      }
      const systemPrompt = [
        '你是专业的博客编辑助手。',
        '请根据用户提供的 Markdown 内容输出严格 JSON。',
        '{ "title": string, "summary": string, "tags": string[], "suggestedSlug": string, "readingTimeMinutes": number }',
        'summary 不超过 200 字，tags 建议 3-6 个中文关键词。',
        '只输出 JSON，不要 Markdown 包裹。',
      ].join('\n');
      const response = await onProxyAiRequest({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cached.content },
        ],
        temperature: 0.2,
        responseFormat: 'json_object',
      });
      const parsed = parseAiJson(response.content);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.summary) setSummary(parsed.summary);
      if (Array.isArray(parsed.tags)) {
        const cleaned = parsed.tags.map(tag => tag.trim()).filter(Boolean);
        setTags(cleaned);
      }
      if (parsed.suggestedSlug) setSlug(parsed.suggestedSlug);
      if (typeof parsed.readingTimeMinutes === 'number') setReadingTimeMinutes(parsed.readingTimeMinutes);
      setIsDirty(true);
    } catch (err) {
      const raw = (err as Error).message || 'AI 分析失败';
      const normalized = raw.includes('API_KEY_REQUIRED')
        ? 'AI Key 未配置，请先在个人设置中填写。'
        : raw.includes('BASE_URL_REQUIRED')
          ? 'AI Base URL 未配置，请先在个人设置中填写。'
          : raw.includes('MODEL_REQUIRED')
            ? 'AI 模型未配置，请先在个人设置中选择。'
            : raw.includes('AUTHOR_REQUIRED')
              ? 'AI 分析仅作者可用。'
              : raw.includes('REQUEST_TIMEOUT')
                ? 'AI 请求超时，请检查网络或模型服务是否可用。'
              : raw;
      setAiError(normalized === 'AI_JSON_PARSE_FAILED' ? 'AI 输出格式错误，请重试。' : normalized);
    } finally {
      setIsAiLoading(false);
    }
  };
  const runSaveWithAssets = async (status: ArticleStatus) => {
    if (!title.trim() || !content.trim()) {
      alert('标题与正文不能为空。');
      return;
    }

    setProcessingState('PROCESSING_IMAGES');
    setProcessingErrors([]);
    setMissingLocalPaths([]);

    try {
      let nextCoverUrl = coverImageUrl;
      let nextCoverUploadId = coverUploadId;
      if (coverLocalAsset) {
        const compressed = await compressImage(coverLocalAsset.blob, compressionQuality);
        const uploadFile = new File(
          [compressed],
          buildUploadFileName(coverLocalAsset.name, compressed.type || coverLocalAsset.type),
          { type: compressed.type || coverLocalAsset.type || 'image/jpeg' }
        );
        const coverResult = await onUploadCover(uploadFile);
        nextCoverUrl = coverResult.url;
        nextCoverUploadId = coverResult.id;
      }

      const result = await processMarkdownImages(content, localAssetsRef.current, onUploadInlineImage, compressionQuality);
      if (result.missingLocalPaths.length > 0) {
        setMissingLocalPaths(Array.from(new Set(result.missingLocalPaths)));
        setProcessingErrors(result.errors);
        setProcessingState('ERROR');
        return;
      }

      if (result.errors.length > 0) {
        setProcessingErrors(result.errors);
        setProcessingState('ERROR');
        return;
      }

      const mergedAssets = { ...uploadedAssetsRef.current, ...result.uploadedAssets };
      uploadedAssetsRef.current = mergedAssets;
      setUploadedAssets(mergedAssets);

      const nextContent = result.content;
      if (nextContent !== content) {
        setContent(nextContent);
      }

      const cleanTags = tags.map(tag => tag.trim()).filter(Boolean);
      const uploadIds = collectReferencedUploadIds(nextContent, mergedAssets, nextCoverUploadId ?? null);

      setProcessingState(status === ArticleStatus.PUBLISHED ? 'SAVING_PUBLISH' : 'SAVING_DRAFT');
      await onSaveToDb({
        id: article?.id,
        status,
        title: title.trim(),
        markdown: nextContent,
        summary: summary.trim() ? summary.trim() : null,
        coverImageUrl: nextCoverUrl && nextCoverUrl.trim() ? nextCoverUrl.trim() : null,
        tags: cleanTags,
        categoryId: categoryId ? categoryId : null,
        slug: slug.trim() ? slug.trim() : null,
        uploadIds,
      });
      await clearDraft(cacheKey);
      setIsCacheReady(false);
      setLastCachedAt(null);
      setLastDbSavedAt(new Date());
      setIsDirty(false);
      setProcessingState('COMPLETE');
      if (coverLocalAsset) {
        setCoverImageUrl(nextCoverUrl);
        setCoverUploadId(nextCoverUploadId ?? null);
      }
      setLocalAssets({});
      setCoverLocalAsset(null);
    } catch (err) {
      setProcessingErrors([{ path: 'article', reason: (err as Error).message || '保存失败' }]);
      setProcessingState('ERROR');
    }
  };

  const handleFinalSave = async (status: ArticleStatus) => {
    await runSaveWithAssets(status);
  };

  const handleFolderUpload = async (fileList: FileList) => {
    const action = pendingAssetActionRef.current;
    if (!action) {
      setProcessingState('IDLE');
      return;
    }

    const files = Array.from(fileList);
    const targetPaths = pendingLocalPathsRef.current.length > 0 ? pendingLocalPathsRef.current : getLocalImageUrls(content);
    const { assets, missing } = buildLocalAssetsFromFiles(targetPaths, files);

    if (missing.length > 0) {
      setProcessingErrors(missing.map(path => ({ path, reason: '本地文件未找到', isLocalMissing: true })));
      setMissingLocalPaths(missing);
      setProcessingState('ERROR');
      return;
    }

    const mergedAssets = { ...localAssetsRef.current, ...assets };
    localAssetsRef.current = mergedAssets;
    setLocalAssets(mergedAssets);
    setProcessingState('IDLE');
    setMissingLocalPaths([]);
    setProcessingErrors([]);
    pendingAssetActionRef.current = null;
    pendingLocalPathsRef.current = [];

    if (action === 'CACHE_SAVE') {
      try {
        await persistCache(mergedAssets);
      } catch (err) {
        alert((err as Error).message || '缓存保存失败');
      }
      return;
    }

    if (action === 'PREVIEW') {
      setIsPreviewMode(true);
    }
  };

  const isBusy = processingState === 'PROCESSING_IMAGES' || processingState === 'WAITING_FOR_ASSETS' || processingState === 'SAVING_DRAFT' || processingState === 'SAVING_PUBLISH';

  const getStatusColor = () => {
    if (processingState === 'WAITING_FOR_ASSETS') return 'bg-[#ffb86c]';
    if (processingState === 'PROCESSING_IMAGES') return 'bg-[#ff79c6]';
    if (processingState === 'SAVING_DRAFT' || processingState === 'SAVING_PUBLISH') return 'bg-[#f1fa8c]';
    if (isAiLoading) return 'bg-[#8be9fd]';
    if (processingState === 'ERROR') return 'bg-[#ff5555]';
    if (lastDbSavedAt) return 'bg-[#50fa7b]';
    if (isCacheReady) return 'bg-[#bd93f9]';
    return 'bg-[#6272a4]';
  };

  const getStatusText = () => {
    if (processingState === 'WAITING_FOR_ASSETS') return '等待补齐本地资源';
    if (processingState === 'PROCESSING_IMAGES') return '处理图片资源';
    if (processingState === 'SAVING_DRAFT') return '保存草稿中';
    if (processingState === 'SAVING_PUBLISH') return '发布中';
    if (isAiLoading) return 'AI 分析中';
    if (lastDbSavedAt) return `已写入数据库 ${lastDbSavedAt.toLocaleTimeString()}`;
    if (isCacheReady && lastCachedAt) return `已缓存 ${lastCachedAt.toLocaleTimeString()}`;
    if (isCacheReady) return '缓存已就绪';
    return '未缓存';
  };

  const canAnalyze = aiReady && isCacheReady && !isAiLoading && !isBusy;
  const canSubmit = !isBusy && (isCacheReady || Boolean(article?.id));

  return (
    <div className="admin-theme flex flex-col h-screen p-6 gap-6 overflow-hidden bg-[#23242d]">
      <ProcessingOverlay
        state={processingState}
        errors={processingErrors}
        missingPaths={missingLocalPaths}
        onClose={() => {
          setProcessingState('IDLE');
          setProcessingErrors([]);
          setMissingLocalPaths([]);
          pendingAssetActionRef.current = null;
          pendingLocalPathsRef.current = [];
        }}
        onUploadFolder={handleFolderUpload}
      />

      <ConfirmModal
        isOpen={isRestorePromptOpen}
        title="检测到缓存"
        message="检测到上次未提交的缓存内容，是否恢复？"
        confirmText="恢复缓存"
        onConfirm={handleApplyCache}
        onCancel={handleDiscardCache}
      />

      <ConfirmModal
        isOpen={isAiConfirmOpen}
        title="AI 将覆盖元数据"
        message="AI 分析会覆盖当前标题、摘要、标签与 slug，是否继续？"
        confirmText="继续分析"
        onConfirm={() => {
          setIsAiConfirmOpen(false);
          handleAnalyze();
        }}
        onCancel={() => setIsAiConfirmOpen(false)}
      />

      <ConfirmModal
        isOpen={isBackConfirmOpen}
        title="确认返回列表"
        message="返回列表将结束当前编辑，未缓存的内容会丢失。"
        confirmText="返回列表"
        onConfirm={() => {
          setIsBackConfirmOpen(false);
          onBack();
        }}
        onCancel={() => setIsBackConfirmOpen(false)}
      />

      <header className="shrink-0 h-20 bg-[#262838]/70 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center px-8 justify-between shadow-2xl shadow-black/40 z-10 transition-all hover:bg-[#262838]/80">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#bd93f9] to-[#ff79c6] rounded-xl flex items-center justify-center text-[#282a36] font-bold shadow-lg shadow-[#bd93f9]/20 transform hover:scale-105 transition-transform">
            AI
          </div>
          <h1 className="text-2xl font-bold text-[#f8f8f2] tracking-tight drop-shadow-md">博客 CMS <span className="text-[#6272a4] font-normal text-lg">| 编辑器</span></h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-sm font-medium text-[#f8f8f2]/90 bg-[#1e1f29]/40 px-4 py-2 rounded-full border border-white/5">
            <span className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></span>
            {getStatusText()}
          </div>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsBackConfirmOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#f8f8f2] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg active:scale-95"
            >
              返回列表
            </button>
            <button
              onClick={() => {
                handleCacheSave();
              }}
              disabled={isBusy}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#f8f8f2] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              <DatabaseIcon className="w-5 h-5" />
              保存到缓存
            </button>
            {canSubmit && (
              <>
                <button
                  onClick={() => handleFinalSave(ArticleStatus.DRAFT)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                >
                  保存草稿
                </button>
                <button
                  onClick={() => handleFinalSave(ArticleStatus.PUBLISHED)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-gradient-to-r from-[#bd93f9] to-[#ff79c6] rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                >
                  发布
                </button>
              </>
            )}
            <button
              onClick={() => setIsAiConfirmOpen(true)}
              disabled={!canAnalyze}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-gradient-to-r from-[#bd93f9] to-[#ff79c6] rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#bd93f9]/30 transition-all active:scale-95"
            >
              {isAiLoading ? (
                <div className="w-5 h-5 border-2 border-[#282a36]/30 border-t-[#282a36] rounded-full animate-spin" />
              ) : (
                <SparklesIcon className="w-5 h-5" />
              )}
              一键AI分析
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* LEFT: Markdown Editor / Preview Panel */}
        <div className="flex-1 flex flex-col bg-[#262838]/70 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40 relative overflow-hidden transition-all hover:bg-[#262838]/80 group">
          <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
            {isCacheReady && (
              <button
                onClick={handleTogglePreview}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#f8f8f2] bg-black/40 border border-white/10 rounded-lg hover:bg-black/60 transition-colors backdrop-blur-md"
              >
                {isPreviewMode ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                {isPreviewMode ? '编辑模式' : '预览模式'}
              </button>
            )}
            {!isPreviewMode && (
              <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#f8f8f2] bg-black/40 border border-white/10 rounded-lg cursor-pointer hover:bg-black/60 transition-colors backdrop-blur-md">
                <DocumentIcon className="w-4 h-4" />
                导入 .md
                <input type="file" accept=".md" onChange={handleFileUpload} className="hidden" />
              </label>
            )}
          </div>

          {isPreviewMode ? (
            <div className="w-full h-full p-8 overflow-y-auto bg-transparent scrollbar-thin">
              <div className="markdown-body max-w-4xl mx-auto">
                {coverPreviewUrl && (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover"
                    className="w-full h-auto rounded-xl mb-8 shadow-2xl object-cover max-h-[500px] border border-white/10"
                  />
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={allowAllUris}>
                  {previewContent || content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              className="w-full h-full p-8 resize-none focus:outline-none text-[#f8f8f2] bg-transparent leading-relaxed font-mono text-base placeholder-[#6272a4] scrollbar-thin"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              placeholder="# 开始写作..."
              spellCheck={false}
            />
          )}
        </div>

        {/* RIGHT: Metadata Panel */}
        <div className="w-[450px] bg-[#262838]/70 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/40 flex flex-col overflow-hidden transition-all hover:bg-[#262838]/80">
          <div className="p-6 border-b border-white/15 bg-black/25">
            <h2 className="text-lg font-bold text-[#f8f8f2] flex items-center gap-2 tracking-wide">
              <DocumentIcon className="text-[#bd93f9]" />
              元数据 (Metadata)
            </h2>
            <div className="flex items-center justify-between mt-2 gap-3">
              <div className="flex items-center gap-4 text-xs font-mono flex-nowrap overflow-x-auto">
                <span className="flex items-center gap-2 whitespace-nowrap text-[#50fa7b]">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(80,250,123,0.6)] ${
                      aiEnabled ? 'bg-[#50fa7b]' : 'bg-[#6272a4]'
                    }`}
                  />
                  AI ENABLE {aiEnabled ? '' : 'OFF'}
                </span>
                <span
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    isAuthor && aiConfigured ? 'text-[#8be9fd]' : 'text-[#ffb86c]'
                  }`}
                >
                  {isAuthor && aiConfigured ? (
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full border border-current" />
                  )}
                  AI配置: {isAuthor ? (aiConfigured ? '已配置' : '未配置') : '仅作者'}
                </span>
                <span
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    aiModelName ? 'text-[#bd93f9]' : 'text-[#6272a4]'
                  }`}
                >
                  模型准备: {aiModelName || '未配置'}
                </span>
              </div>
              {isDirty && (
                <span className="text-[10px] bg-[#ffb86c]/20 text-[#ffb86c] px-2 py-0.5 rounded border border-[#ffb86c]/30 font-bold whitespace-nowrap">
                  未缓存
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto scrollbar-thin">
            {aiError && (
              <div className="rounded-md border border-[#ff5555]/40 bg-[#ff5555]/10 px-3 py-2 text-xs text-[#ffb86c] flex items-center gap-2">
                <ExclamationTriangleIcon />
                {aiError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">封面图 (Cover Image)</label>
              <div className="border-2 border-dashed border-[#6272a4]/50 rounded-xl p-4 text-center hover:border-[#bd93f9] transition-colors relative group bg-black/20 hover:bg-black/30">
                {coverPreviewUrl ? (
                  <div className="relative group/image">
                    <img src={coverPreviewUrl} className="w-full h-32 object-cover rounded-lg border border-white/10 shadow-lg" alt="Cover Preview" />
                    <button onClick={handleClearCover} className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-[#ff5555] transition-colors backdrop-blur-sm opacity-0 group-hover/image:opacity-100">
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-4">
                    <PhotoIcon className="mx-auto h-8 w-8 text-[#6272a4] mb-2 group-hover:text-[#bd93f9] transition-colors" />
                    <span className="text-sm font-medium text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors">点击上传封面</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageChange} />
                  </label>
                )}
              </div>
              {isUploadingCover && (
                <p className="text-xs text-[#bd93f9]">封面上传中...</p>
              )}
              {coverUploadError && (
                <p className="text-xs text-[#ff5545]">{coverUploadError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">标题</label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-3 bg-[#1e1f29]/60 border border-white/10 rounded-xl text-[#f8f8f2] text-sm focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent outline-none transition-all placeholder-white/20 font-medium"
                placeholder="请输入文章标题"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-3 bg-[#1e1f29]/60 border border-white/10 rounded-xl text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all font-mono text-xs"
                  placeholder="my-blog-post"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">阅读时间</label>
                <input
                  type="number"
                  min={0}
                  value={readingTimeMinutes ?? ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    setReadingTimeMinutes(Number.isNaN(value) ? null : value);
                    setIsDirty(true);
                  }}
                  className="w-full px-4 py-3 bg-[#1e1f29]/60 border border-white/10 rounded-xl text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all font-mono text-xs"
                  placeholder="分钟"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">分类</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-3 bg-[#1e1f29]/60 border border-white/10 rounded-xl text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all"
              >
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">摘要</label>
              <textarea
                rows={4}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setIsDirty(true);
                }}
                className="w-full px-4 py-3 bg-[#1e1f29]/60 border border-white/10 rounded-xl text-[#f8f8f2] text-sm outline-none resize-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all leading-relaxed"
                placeholder="概述文章核心内容..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">标签</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, idx) => (
                  <div key={`${tag}-${idx}`} className="flex items-center gap-1 px-3 py-1.5 bg-[#bd93f9]/10 text-[#bd93f9] text-xs font-bold rounded-full border border-[#bd93f9]/30 group hover:border-[#bd93f9] hover:bg-[#bd93f9]/20 transition-all shadow-sm">
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(idx)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors ml-1"
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <div className="flex items-center gap-2 bg-black/20 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-[#bd93f9] focus-within:bg-[#1e1f29]/60 transition-all">
                  <PlusIcon className="w-3 h-3 text-[#6272a4]" />
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    onBlur={handleAddTag}
                    placeholder="Add tag"
                    className="bg-transparent border-none outline-none text-xs text-[#f8f8f2] w-16 placeholder-[#6272a4] font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

