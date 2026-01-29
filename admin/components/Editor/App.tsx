import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConfirmModal from '../ConfirmModal';
import { Article, Category, ArticleStatus } from '../../types';
import type { UploadResult } from '../../services/upload';
import { clearDraft, loadDraft, saveDraft, type EditorCacheRecord, type CachedAsset } from './cache';
import { EditorHeader } from './components/EditorHeader';
import { MarkdownPanel } from './components/MarkdownPanel';
import { MetadataPanel } from './components/MetadataPanel';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import type { ProcessingError, ProcessingState } from './types';
import { parseAiJson, resolveAiSystemPrompt } from './utils/ai';
import {
  DEFAULT_IMAGE_QUALITY,
  buildLocalAssetsFromFiles,
  buildUploadFileName,
  collectReferencedUploadIds,
  compressImage,
  extractImageUrls,
  getLocalImageUrls,
  hasLocalAsset,
  isDataImageUrl,
  isRemoteUrl,
  processMarkdownImages,
  resolveLocalAsset,
} from './utils/images';

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
  aiPrompt?: string;
  autoSaveInterval: number;
  imageCompressionQuality?: number;
  onNotify?: (message: string) => void;
  onBack: () => void;
  onProxyAiRequest: (input: AiProxyInput) => Promise<{ content: string }>;
  onUploadCover: (file: File) => Promise<UploadResult>;
  onUploadInlineImage: (file: File) => Promise<UploadResult>;
  onSaveToDb: (payload: EditorSavePayload) => Promise<Article>;
}


export default function EditorPage({
  article,
  categories,
  defaultCategoryId,
  aiEnabled,
  isAuthor,
  aiConfigured,
  aiModelName,
  aiPrompt,
  autoSaveInterval,
  imageCompressionQuality,
  onNotify,
  onBack,
  onProxyAiRequest,
  onUploadCover,
  onUploadInlineImage,
  onSaveToDb,
}: EditorPageProps) {
  const notify = onNotify ?? ((message: string) => window.alert(message));
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
    const urls = Object.values(previewAssetUrlsRef.current) as string[];
    urls.forEach(url => {
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
      notify((err as Error).message || '缓存保存失败');
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

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsDirty(true);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setIsDirty(true);
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    setIsDirty(true);
  };

  const handleReadingTimeChange = (value: number | null) => {
    setReadingTimeMinutes(value);
    setIsDirty(true);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setIsDirty(true);
  };

  const handleSummaryChange = (value: string) => {
    setSummary(value);
    setIsDirty(true);
  };

  const handleNewTagInputChange = (value: string) => {
    setNewTagInput(value);
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
      notify('AI 助手已关闭，请联系管理员开启。');
      return;
    }
    if (!isAuthor) {
      notify('AI 分析仅作者可用。');
      return;
    }
    if (!aiConfigured) {
      notify('请先在个人设置中完成 AI 配置。');
      return;
    }
    setIsAiLoading(true);
    setAiError('');
    try {
      const cached = await loadDraft(cacheKey);
      if (!cached?.content) {
        throw new Error('请先保存到缓存再进行 AI 分析。');
      }
      const systemPrompt = resolveAiSystemPrompt(aiPrompt);
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
      notify('标题与正文不能为空。');
      return;
    }

    setProcessingState('PROCESSING_IMAGES');
    setProcessingErrors([]);
    setMissingLocalPaths([]);

    try {
      let nextCoverUrl = coverImageUrl;
      let nextCoverUploadId = coverUploadId;
      if (coverLocalAsset) {
        const shouldCompress = Number.isFinite(compressionQuality) && compressionQuality < 0.999;
        const payloadBlob = shouldCompress
          ? await compressImage(coverLocalAsset.blob, compressionQuality)
          : coverLocalAsset.blob;
        const uploadFile = new File(
          [payloadBlob],
          buildUploadFileName(coverLocalAsset.name, payloadBlob.type || coverLocalAsset.type),
          { type: payloadBlob.type || coverLocalAsset.type || 'application/octet-stream' }
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
        notify((err as Error).message || '缓存保存失败');
      }
      return;
    }

    if (action === 'PREVIEW') {
      setIsPreviewMode(true);
    }
  };

  const isBusy = processingState === 'PROCESSING_IMAGES' || processingState === 'WAITING_FOR_ASSETS' || processingState === 'SAVING_DRAFT' || processingState === 'SAVING_PUBLISH';

  const getStatusColor = () => {
    if (processingState === 'WAITING_FOR_ASSETS') return 'bg-warning';
    if (processingState === 'PROCESSING_IMAGES') return 'bg-accent';
    if (processingState === 'SAVING_DRAFT' || processingState === 'SAVING_PUBLISH') return 'bg-primary';
    if (isAiLoading) return 'bg-secondary';
    if (processingState === 'ERROR') return 'bg-danger';
    if (lastDbSavedAt) return 'bg-success';
    if (isCacheReady) return 'bg-primary';
    return 'bg-muted';
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
    <div className="admin-theme flex flex-col h-screen p-6 gap-6 overflow-hidden bg-canvas">
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

      <EditorHeader
        statusText={getStatusText()}
        statusDotClassName={getStatusColor()}
        isBusy={isBusy}
        isAiLoading={isAiLoading}
        canAnalyze={canAnalyze}
        canSubmit={canSubmit}
        onBack={() => setIsBackConfirmOpen(true)}
        onCacheSave={handleCacheSave}
        onSaveDraft={() => handleFinalSave(ArticleStatus.DRAFT)}
        onPublish={() => handleFinalSave(ArticleStatus.PUBLISHED)}
        onAnalyze={() => setIsAiConfirmOpen(true)}
      />

      <main className="flex-1 flex gap-6 overflow-hidden min-h-0">
        <MarkdownPanel
          isCacheReady={isCacheReady}
          isPreviewMode={isPreviewMode}
          onTogglePreview={handleTogglePreview}
          onFileUpload={handleFileUpload}
          coverPreviewUrl={coverPreviewUrl}
          previewContent={previewContent}
          content={content}
          onContentChange={handleContentChange}
        />
        <MetadataPanel
          aiEnabled={aiEnabled}
          isAuthor={isAuthor}
          aiConfigured={aiConfigured}
          aiModelName={aiModelName}
          isDirty={isDirty}
          aiError={aiError}
          coverPreviewUrl={coverPreviewUrl}
          isUploadingCover={isUploadingCover}
          coverUploadError={coverUploadError}
          onCoverChange={handleCoverImageChange}
          onClearCover={handleClearCover}
          title={title}
          onTitleChange={handleTitleChange}
          slug={slug}
          onSlugChange={handleSlugChange}
          readingTimeMinutes={readingTimeMinutes}
          onReadingTimeChange={handleReadingTimeChange}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          categories={categories}
          summary={summary}
          onSummaryChange={handleSummaryChange}
          tags={tags}
          onRemoveTag={handleRemoveTag}
          newTagInput={newTagInput}
          onNewTagInputChange={handleNewTagInputChange}
          onAddTag={handleAddTag}
        />
      </main>
    </div>
  );
}

