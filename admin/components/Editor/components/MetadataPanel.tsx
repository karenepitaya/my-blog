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

    <div className="p-5 space-y-5 flex-1 overflow-y-auto scrollbar-thin">
      {aiError && (
        <div className="rounded-md border border-[#ff5555]/40 bg-[#ff5555]/10 px-3 py-2 text-xs text-[#ffb86c] flex items-center gap-2">
          <ExclamationTriangleIcon />
          {aiError}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-black/15 p-4 space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">封面图 (Cover Image)</label>
        <div className="border-2 border-dashed border-[#6272a4]/50 rounded-xl p-3 text-center hover:border-[#bd93f9] transition-colors relative group bg-black/20 hover:bg-black/30">
          {coverPreviewUrl ? (
            <div className="relative group/image">
              <img src={coverPreviewUrl} className="w-full h-32 object-cover rounded-lg border border-white/10 shadow-lg" alt="Cover Preview" />
              <button onClick={onClearCover} className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-[#ff5555] transition-colors backdrop-blur-sm opacity-0 group-hover/image:opacity-100">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block py-3">
              <PhotoIcon className="mx-auto h-7 w-7 text-[#6272a4] mb-2 group-hover:text-[#bd93f9] transition-colors" />
              <span className="text-sm font-medium text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors">点击上传封面</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
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

      <div className="rounded-xl border border-white/10 bg-black/15 p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">标题</label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full h-10 px-4 bg-[#1e1f29]/60 border border-white/10 rounded-lg text-[#f8f8f2] text-sm focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent outline-none transition-all placeholder-white/20 font-medium"
            placeholder="请输入文章标题"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(event) => onSlugChange(event.target.value)}
              className="w-full h-10 px-4 bg-[#1e1f29]/60 border border-white/10 rounded-lg text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all font-mono text-xs"
              placeholder="my-blog-post"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">阅读时间</label>
            <input
              type="number"
              min={0}
              value={readingTimeMinutes ?? ''}
              onChange={(event) => {
                const value = event.target.value ? Number(event.target.value) : null;
                onReadingTimeChange(Number.isNaN(value) ? null : value);
              }}
              className="w-full h-10 px-4 bg-[#1e1f29]/60 border border-white/10 rounded-lg text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all font-mono text-xs"
              placeholder="分钟"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/15 p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">分类</label>
          <select
            value={categoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full h-10 px-4 bg-[#1e1f29]/60 border border-white/10 rounded-lg text-[#f8f8f2] text-sm outline-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all"
          >
            <option value="">未分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">摘要</label>
          <textarea
            rows={4}
            value={summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            className="w-full px-4 py-2.5 bg-[#1e1f29]/60 border border-white/10 rounded-lg text-[#f8f8f2] text-sm outline-none resize-none focus:ring-2 focus:ring-[#bd93f9] focus:border-transparent transition-all leading-relaxed"
            placeholder="概述文章核心内容..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/15 p-4 space-y-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#6272a4]">标签</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <div key={`${tag}-${idx}`} className="flex items-center gap-1 px-3 py-1.5 bg-[#bd93f9]/10 text-[#bd93f9] text-xs font-bold rounded-full border border-[#bd93f9]/30 group hover:border-[#bd93f9] hover:bg-[#bd93f9]/20 transition-all shadow-sm">
              <span>#{tag}</span>
              <button
                onClick={() => onRemoveTag(idx)}
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
              onChange={(event) => onNewTagInputChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  onAddTag();
                }
              }}
              onBlur={onAddTag}
              placeholder="Add tag"
              className="bg-transparent border-none outline-none text-xs text-[#f8f8f2] w-16 placeholder-[#6272a4] font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
