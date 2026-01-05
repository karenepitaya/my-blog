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
  <header className="shrink-0 h-20 bg-[#262838]/70 backdrop-blur-2xl border border-white/20 rounded-2xl flex items-center px-8 justify-between shadow-2xl shadow-black/40 z-10 transition-all hover:bg-[#262838]/80">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gradient-to-tr from-[#bd93f9] to-[#ff79c6] rounded-xl flex items-center justify-center text-[#282a36] font-bold shadow-lg shadow-[#bd93f9]/20 transform hover:scale-105 transition-transform">
        AI
      </div>
      <h1 className="text-2xl font-bold text-[#f8f8f2] tracking-tight drop-shadow-md">
        博客 CMS <span className="text-[#6272a4] font-normal text-lg">| 编辑器</span>
      </h1>
    </div>

    <div className="flex items-center gap-6">
      <div className="flex items-center gap-3 text-sm font-medium text-[#f8f8f2]/90 bg-[#1e1f29]/40 px-4 py-2 rounded-full border border-white/5">
        <span className={`w-2.5 h-2.5 rounded-full ${statusDotClassName} animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.5)]`}></span>
        {statusText}
      </div>
      <div className="h-8 w-px bg-white/10 mx-2"></div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#f8f8f2] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all shadow-lg active:scale-95"
        >
          返回列表
        </button>
        <button
          onClick={onCacheSave}
          disabled={isBusy}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#f8f8f2] bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          <DatabaseIcon className="w-5 h-5" />
          保存到缓存
        </button>
        {canSubmit && (
          <>
            <button
              onClick={onSaveDraft}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-gradient-to-r from-[#50fa7b] to-[#8be9fd] rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
            >
              保存草稿
            </button>
            <button
              onClick={onPublish}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#282a36] bg-gradient-to-r from-[#bd93f9] to-[#ff79c6] rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95"
            >
              发布
            </button>
          </>
        )}
        <button
          onClick={onAnalyze}
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
);
