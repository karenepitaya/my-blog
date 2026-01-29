import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentIcon, EyeIcon, EyeSlashIcon } from './icons';

const allowAllUris = (uri: string) => uri;

interface MarkdownPanelProps {
  isCacheReady: boolean;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  coverPreviewUrl: string;
  previewContent: string;
  content: string;
  onContentChange: (value: string) => void;
}

export const MarkdownPanel: React.FC<MarkdownPanelProps> = ({
  isCacheReady,
  isPreviewMode,
  onTogglePreview,
  onFileUpload,
  coverPreviewUrl,
  previewContent,
  content,
  onContentChange,
}) => (
  <div className="flex-1 flex flex-col bg-surface/70 backdrop-blur-sm border border-border rounded-2xl shadow-lg relative overflow-hidden">
    <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
      {isCacheReady && (
        <button
          onClick={onTogglePreview}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-fg bg-surface2/40 border border-border rounded-lg hover:bg-fg/5 transition-colors backdrop-blur-sm"
        >
          {isPreviewMode ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          {isPreviewMode ? '编辑模式' : '预览模式'}
        </button>
      )}
      {!isPreviewMode && (
        <label className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-fg bg-surface2/40 border border-border rounded-lg cursor-pointer hover:bg-fg/5 transition-colors backdrop-blur-sm">
          <DocumentIcon className="w-4 h-4" />
          导入 .md
          <input type="file" accept=".md" onChange={onFileUpload} className="hidden" />
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
              className="w-full h-auto rounded-xl mb-8 shadow-lg object-cover max-h-[500px] border border-border"
            />
          )}
          <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={allowAllUris}>
            {previewContent || content}
          </ReactMarkdown>
        </div>
      </div>
    ) : (
      <textarea
        className="w-full h-full p-8 resize-none outline-none text-fg bg-transparent leading-relaxed font-mono text-base placeholder:text-muted scrollbar-thin focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
        value={content}
        onChange={(event) => onContentChange(event.target.value)}
        placeholder="# 开始写作..."
        spellCheck={false}
      />
    )}
  </div>
);
