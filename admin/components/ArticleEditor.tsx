
import React, { useState, useRef } from 'react';
import { Article, Category, ArticleStatus } from '../types';
import { Icons } from '../constants';
import { getAIWritingAssistant } from '../services/geminiService';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface ArticleEditorProps {
  article?: Article;
  categories: Category[];
  onSave: (data: Partial<Article>) => void;
  onCancel: () => void;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ article, categories, onSave, onCancel }) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.markdown || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl || '');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [saveStep, setSaveStep] = useState<'editing' | 'confirming'>('editing');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证逻辑：标题和内容均不能为空
  const isFormValid = title.trim() !== '' && content.trim() !== '';

  const handleAiAssist = async () => {
    if (!content) return;
    setIsAiLoading(true);
    const result = await getAIWritingAssistant(content);
    if (result) {
      setSummary(result.summary);
      if (result.tags) setTags([...new Set([...tags, ...result.tags])]);
    }
    setIsAiLoading(false);
  };

  const addTag = () => {
    const raw = newTag.trim();
    if (!raw) return;
    const next = raw
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    setTags(prev => Array.from(new Set([...prev, ...next])));
    setNewTag('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFinalSave = (status: ArticleStatus) => {
    if (!isFormValid) return;
    const cleanTags = tags.map(tag => tag.trim()).filter(Boolean);
    onSave({
      title,
      markdown: content,
      summary: summary.trim() ? summary.trim() : null,
      coverImageUrl: coverImageUrl.trim() ? coverImageUrl.trim() : null,
      tags: cleanTags,
      categoryId: categoryId ? categoryId : null,
      status,
    });
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader 
        title={article ? '编辑文章内容' : '撰写新文章'} 
        motto={article ? `正在同步资源节点: ${article.id}` : "开始在数字空间留下您的思想印记_"} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
        
        {/* 左侧编辑器区域 */}
        <div className="lg:col-span-8 space-y-8">
          <div className={`bg-[#21222c]/60 backdrop-blur-md border-2 p-2 rounded-2xl shadow-xl transition-all ${title.trim() ? 'border-[#44475a] focus-within:border-[#bd93f9]' : 'border-[#ff5545]/30 focus-within:border-[#ff5545]'}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题 (必填) / Article_Title..."
              className="w-full bg-transparent p-6 text-2xl md:text-3xl font-bold text-[#f8f8f2] focus:outline-none placeholder-[#44475a]"
            />
          </div>
          
          <div className={`bg-[#21222c]/60 backdrop-blur-md border-2 rounded-2xl overflow-hidden shadow-xl relative group transition-all ${content.trim() ? 'border-[#44475a] focus-within:border-[#bd93f9]' : 'border-[#ff5545]/30 focus-within:border-[#ff5545]'}`}>
            <div className="flex absolute top-4 right-6 gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="file" accept=".md" onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) {
                   const reader = new FileReader();
                   reader.onload = (re) => setContent(re.target?.result as string);
                   reader.readAsText(file);
                }
              }} ref={fileInputRef} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[#44475a] text-[10px] font-bold text-[#f8f8f2] rounded-lg border border-[#6272a4] hover:bg-[#6272a4] transition-all uppercase tracking-widest">导入 MD</button>
              <button onClick={handleAiAssist} disabled={isAiLoading} className="px-4 py-2 bg-[#bd93f9]/20 text-[10px] font-bold text-[#bd93f9] rounded-lg border border-[#bd93f9]/50 hover:bg-[#bd93f9]/40 transition-all uppercase tracking-widest">{isAiLoading ? '分析中...' : 'AI 助理'}</button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此处输入内容 (必填)，支持 Markdown 语法 / Content_Payload..."
              className="w-full h-[600px] lg:h-[750px] bg-transparent p-8 md:p-10 text-base md:text-lg font-mono text-[#f8f8f2] focus:outline-none resize-none placeholder-[#44475a] leading-relaxed custom-scrollbar"
            />
          </div>
        </div>

        {/* 右侧配置面板区域 */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-[#21222c]/80 backdrop-blur-md border-2 border-[#44475a] rounded-2xl px-5 py-8 shadow-xl">
            <h3 className="text-[10px] font-black text-[#6272a4] uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#bd93f9] rounded-full shadow-[0_0_8px_#bd93f9]" />
              元数据配置
            </h3>
            
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">所属专栏</label>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] appearance-none cursor-pointer outline-none transition-all pr-10"
                  >
                    <option value="">未归类</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#6272a4]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {article?.slug && (
                <div>
                  <label className="block text-[10px] text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">文章 Slug</label>
                  <input
                    type="text"
                    value={article.slug}
                    readOnly
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#6272a4] rounded-xl outline-none font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">封面图 URL（可选）</label>
                <input
                  type="text"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a] shadow-inner"
                />
                {coverImageUrl.trim() && (
                  <img
                    src={coverImageUrl}
                    alt="文章封面预览"
                    className="mt-3 h-28 w-full object-cover rounded-xl border border-[#44475a]"
                  />
                )}
              </div>
              <div>
                <label className="block text-[10px] text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">标签管理</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#44475a]/40 border border-[#bd93f9]/30 text-[#bd93f9] text-[10px] font-black rounded-lg uppercase group hover:border-[#bd93f9] transition-all">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-[#ff5545] font-mono transition-colors">×</button>
                    </span>
                  ))}
                </div>
                <div className="group relative">
                  <input 
                    type="text" 
                    value={newTag}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="输入标签并回车..."
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a] shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-[#6272a4] font-mono opacity-0 group-focus-within:opacity-100 transition-opacity">ENT</div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">内容摘要</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="写点什么来吸引读者..."
                  className="w-full h-40 bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none leading-relaxed placeholder-[#44475a] custom-scrollbar shadow-inner"
                />
              </div>

              <div className="pt-8 border-t border-[#44475a] space-y-4">
                {saveStep === 'editing' ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSaveStep('confirming')}
                      disabled={!isFormValid}
                      className={`w-full py-4 font-black text-xs rounded-xl transition-all shadow-lg uppercase tracking-[0.2em] active:scale-95 border-b-4 
                        ${isFormValid 
                          ? 'bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] border-[#bd93f9]/30' 
                          : 'bg-[#44475a] text-[#6272a4] border-transparent opacity-50 cursor-not-allowed'}`}
                    >
                      完成撰写
                    </button>
                    <button
                      onClick={() => setIsDiscardConfirmOpen(true)}
                      className="w-full py-3 text-[10px] font-black text-[#6272a4] hover:text-[#ff5545] uppercase tracking-widest transition-colors"
                    >
                      放弃修改
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 animate-in slide-in-from-top-4 duration-300">
                    <button
                      onClick={() => handleFinalSave(ArticleStatus.PUBLISHED)}
                      className="w-full py-4 bg-[#50fa7b] hover:bg-[#50fa7b]/80 text-[#282a36] font-black text-xs rounded-xl shadow-xl uppercase tracking-[0.2em] active:scale-95 border-b-4 border-[#50fa7b]/30"
                    >
                      立即发布
                    </button>
                    <button
                      onClick={() => handleFinalSave(ArticleStatus.DRAFT)}
                      className="w-full py-4 bg-[#282a36] border-2 border-[#44475a] text-[#f1fa8c] font-black text-xs rounded-xl shadow-lg uppercase tracking-[0.2em] hover:border-[#f1fa8c]/50 active:scale-95"
                    >
                      保存草稿
                    </button>
                    <button
                      onClick={() => setSaveStep('editing')}
                      className="w-full py-2 text-[10px] font-black text-[#6272a4] uppercase tracking-widest hover:text-[#f8f8f2] text-center"
                    >
                      返回重新校对
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#191a21]/60 backdrop-blur-sm p-6 rounded-2xl border-2 border-[#44475a] space-y-3 shadow-inner">
             <div className="flex justify-between text-[10px] font-mono uppercase font-black">
                <span className="text-[#6272a4]">安全协议:</span>
                <span className="text-[#50fa7b]">SSL_SECURE</span>
             </div>
             <div className="flex justify-between text-[10px] font-mono uppercase font-black">
                <span className="text-[#6272a4]">字节载荷:</span>
                <span className="text-[#f8f8f2]">{new Blob([content]).size} BYTES</span>
             </div>
             {!isFormValid && (
               <div className="pt-2">
                 <p className="text-[9px] text-[#ff5545] font-black uppercase animate-pulse">验证错误: 标题与内容不得为空_</p>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* 放弃更改的二次确认 */}
      <ConfirmModal 
        isOpen={isDiscardConfirmOpen}
        title="放弃撰写协议"
        message="警告：当前编辑器内所有未保存的字符载荷将从内存中销毁。此操作不可逆，确定放弃吗？"
        confirmText="确认放弃"
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          onCancel();
        }}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />
    </div>
  );
};

export default ArticleEditor;
