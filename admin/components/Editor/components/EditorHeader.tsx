import React from 'react';
import { DatabaseIcon, SparklesIcon } from './icons';

interface EditorHeaderProps {
  statusText: string;
  statusDotClassName: string;
  isBusy: boolean;
  isAiLoading: boolean;
  canAnalyze: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onCacheSave: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onAnalyze: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  statusText,
  statusDotClassName,
  isBusy,
  isAiLoading,
  canAnalyze,
  canSubmit,
  onBack,
  onCacheSave,
  onSaveDraft,
  onPublish,
  onAnalyze,
}) => (
  <header className="shrink-0 h-20 bg-surface/70 backdrop-blur-sm border border-border rounded-2xl flex items-center px-8 justify-between shadow-lg z-10">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-primary/12 border border-primary/20 rounded-xl flex items-center justify-center text-primary font-semibold">
        AI
      </div>
      <h1 className="text-2xl font-semibold text-fg tracking-tight">
        博客 CMS <span className="text-muted font-normal text-lg">| 编辑器</span>
      </h1>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3 text-sm font-medium text-muted bg-surface2/40 px-4 py-2 rounded-full border border-border">
        <span className={`w-2.5 h-2.5 rounded-full ${statusDotClassName} motion-safe:animate-pulse`}></span>
        {statusText}
      </div>
      <div className="h-8 w-px bg-border mx-2"></div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-fg bg-surface border border-border rounded-xl hover:bg-fg/5 hover:border-fg/20 transition-colors active:scale-95"
        >
          返回列表
        </button>
        <button
          onClick={onCacheSave}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-fg bg-surface border border-border rounded-xl hover:bg-fg/5 hover:border-fg/20 disabled:opacity-50 transition-colors active:scale-95"
        >
          <DatabaseIcon className="w-5 h-5" />
          保存到缓存
        </button>
        {canSubmit && (
          <>
            <button
              onClick={onSaveDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-canvas bg-primary rounded-xl hover:opacity-90 transition-opacity active:scale-95"
            >
              保存草稿
            </button>
            <button
              onClick={onPublish}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-canvas bg-primary rounded-xl hover:opacity-90 transition-opacity active:scale-95"
            >
              发布
            </button>
          </>
        )}
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-canvas bg-primary rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity active:scale-95"
        >
          {isAiLoading ? (
            <div className="w-5 h-5 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" />
          ) : (
            <SparklesIcon className="w-5 h-5" />
          )}
          一键AI分析
        </button>
      </div>
    </div>
  </header>
);
