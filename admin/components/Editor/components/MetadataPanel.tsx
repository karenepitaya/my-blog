import React from 'react';
import type { Category } from '../../../types';
import { DocumentIcon, ExclamationTriangleIcon, PhotoIcon, PlusIcon, XMarkIcon } from './icons';

interface MetadataPanelProps {
  aiEnabled: boolean;
  isAuthor: boolean;
  aiConfigured: boolean;
  aiModelName?: string;
  isDirty: boolean;
  aiError: string;
  coverPreviewUrl: string;
  isUploadingCover: boolean;
  coverUploadError: string;
  onCoverChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCover: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  readingTimeMinutes: number | null;
  onReadingTimeChange: (value: number | null) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  categories: Category[];
  summary: string;
  onSummaryChange: (value: string) => void;
  tags: string[];
  onRemoveTag: (index: number) => void;
  newTagInput: string;
  onNewTagInputChange: (value: string) => void;
  onAddTag: () => void;
}

export const MetadataPanel: React.FC<MetadataPanelProps> = ({
  aiEnabled,
  isAuthor,
  aiConfigured,
  aiModelName,
  isDirty,
  aiError,
  coverPreviewUrl,
  isUploadingCover,
  coverUploadError,
  onCoverChange,
  onClearCover,
  title,
  onTitleChange,
  slug,
  onSlugChange,
  readingTimeMinutes,
  onReadingTimeChange,
  categoryId,
  onCategoryChange,
  categories,
  summary,
  onSummaryChange,
  tags,
  onRemoveTag,
  newTagInput,
  onNewTagInputChange,
  onAddTag,
}) => (
  <div className="w-[450px] bg-surface/70 backdrop-blur-sm border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden">
    <div className="p-6 border-b border-border bg-surface/35">
      <h2 className="text-lg font-semibold text-fg flex items-center gap-2 tracking-wide">
        <DocumentIcon className="text-primary" />
        元数据 (Metadata)
      </h2>
      <div className="flex items-center justify-between mt-2 gap-3">
        <div className="flex items-center gap-4 text-xs font-mono flex-nowrap overflow-x-auto">
          <span className="flex items-center gap-2 whitespace-nowrap text-success">
            <span
              className={`w-2.5 h-2.5 rounded-full ring-1 ring-border/60 ${
                aiEnabled ? 'bg-success' : 'bg-muted'
              }`}
            />
            AI ENABLE {aiEnabled ? '' : 'OFF'}
          </span>
          <span
            className={`flex items-center gap-2 whitespace-nowrap ${
              isAuthor && aiConfigured ? 'text-secondary' : 'text-warning'
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
              aiModelName ? 'text-primary' : 'text-muted'
            }`}
          >
            模型准备: {aiModelName || '未配置'}
          </span>
        </div>
        {isDirty && (
          <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded border border-warning/20 font-semibold whitespace-nowrap">
            未缓存
          </span>
        )}
      </div>
    </div>

    <div className="p-5 space-y-5 flex-1 overflow-y-auto scrollbar-thin">
      {aiError && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger flex items-center gap-2">
          <ExclamationTriangleIcon />
          {aiError}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <label className="text-[10px] font-semibold tracking-wider text-muted">封面图 (Cover Image)</label>
        <div className="border-2 border-dashed border-border rounded-xl p-3 text-center hover:border-primary/40 transition-colors relative group bg-surface2/30 hover:bg-fg/3">
          {coverPreviewUrl ? (
            <div className="relative group/image">
              <img src={coverPreviewUrl} className="w-full h-32 object-cover rounded-lg border border-border shadow-md" alt="Cover Preview" />
              <button onClick={onClearCover} className="absolute top-2 right-2 bg-surface2/80 text-fg p-1.5 rounded-full hover:bg-danger hover:text-fg transition-colors backdrop-blur-sm opacity-0 group-hover/image:opacity-100">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block py-3">
              <PhotoIcon className="mx-auto h-7 w-7 text-muted mb-2 group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-fg group-hover:text-primary transition-colors">点击上传封面</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
            </label>
          )}
        </div>
        {isUploadingCover && (
          <p className="text-xs text-muted">封面上传中...</p>
        )}
        {coverUploadError && (
          <p className="text-xs text-danger">{coverUploadError}</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted">标题</label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full h-10 px-4 bg-surface border border-border rounded-lg text-fg text-sm outline-none transition-colors placeholder:text-muted font-medium focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="请输入文章标题"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-wider text-muted">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
              className="w-full h-10 px-4 bg-surface border border-border rounded-lg text-fg text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors font-mono text-xs"
              placeholder="my-blog-post"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold tracking-wider text-muted">阅读时间</label>
            <input
              type="number"
              min={0}
              value={readingTimeMinutes ?? ''}
              onChange={(event) => {
                const value = event.target.value ? Number(event.target.value) : null;
                onReadingTimeChange(Number.isNaN(value) ? null : value);
              }}
              className="w-full h-10 px-4 bg-surface border border-border rounded-lg text-fg text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors font-mono text-xs"
              placeholder="分钟"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted">分类</label>
          <select
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full h-10 px-4 bg-surface border border-border rounded-lg text-fg text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            <option value="">未分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold tracking-wider text-muted">摘要</label>
          <textarea
            rows={4}
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-fg text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-ring transition-colors leading-relaxed placeholder:text-muted"
            placeholder="概述文章核心内容..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface/40 p-4 space-y-3">
        <label className="text-[10px] font-semibold tracking-wider text-muted">标签</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <div key={`${tag}-${idx}`} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 group hover:border-primary/40 hover:bg-primary/15 transition-colors shadow-sm">
              <span>#{tag}</span>
              <button
                onClick={() => onRemoveTag(idx)}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary hover:text-canvas transition-colors ml-1"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 bg-surface2/30 border border-border rounded-full px-3 py-1.5 focus-within:border-primary/50 focus-within:bg-surface transition-colors">
            <PlusIcon className="w-3 h-3 text-muted" />
            <input
              type="text"
              value={newTagInput}
              onChange={(event) => onNewTagInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onAddTag();
                }
              }}
              onBlur={onAddTag}
              placeholder="Add tag"
              className="bg-transparent border-none outline-none text-xs text-fg w-16 placeholder:text-muted font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
