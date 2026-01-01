
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Article, Category, ArticleStatus, Tag } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface ArticleEditorProps {
  article?: Article;
  categories: Category[];
  onSave: (data: Partial<Article>) => void;
  onCancel: () => void;
  onLoadTags: (options?: { page?: number; pageSize?: number }) => Promise<Tag[]>;
  onCreateTag: (input: { name: string }) => Promise<Tag | null>;
  onUploadCover: (file: File) => Promise<string>;
  defaultCategoryId?: string;
}

const TAG_PAGE_SIZE = 200;
const RECENT_TAGS_KEY = 'admin_recent_article_tags';
const READING_SPEED_WPM = 300;

const ArticleEditor: React.FC<ArticleEditorProps> = ({
  article,
  categories,
  onSave,
  onCancel,
  onLoadTags,
  onCreateTag,
  onUploadCover,
  defaultCategoryId,
}) => {
  const [title, setTitle] = useState(article?.title || '');
  const [content, setContent] = useState(article?.markdown || '');
  const [summary, setSummary] = useState(article?.summary || '');
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl || '');
  const [coverPreviewUrl, setCoverPreviewUrl] = useState(article?.coverImageUrl || '');
  const [tags, setTags] = useState<string[]>(article?.tags || []);
  const [tagQuery, setTagQuery] = useState('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
  const [recentTags, setRecentTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_TAGS_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as string[];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (err) {
      return [];
    }
  });
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? defaultCategoryId ?? '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadError, setCoverUploadError] = useState('');
  const [saveStep, setSaveStep] = useState<'editing' | 'confirming'>('editing');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const markdownInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const coverBlobUrlRef = useRef<string | null>(null);
  const tagBlurTimerRef = useRef<number | null>(null);
  const isEditingPublished = article?.status === ArticleStatus.PUBLISHED;

  // 验证逻辑：标题和内容均不能为空
  const isFormValid = title.trim() !== '' && content.trim() !== '';

  useEffect(() => {
    let active = true;
    onLoadTags({ pageSize: TAG_PAGE_SIZE })
      .then(data => {
        if (active) setAvailableTags(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [onLoadTags]);

  useEffect(() => {
    if (article?.categoryId !== undefined) {
      setCategoryId(article.categoryId ?? '');
      return;
    }
    if (defaultCategoryId !== undefined) {
      setCategoryId(defaultCategoryId ?? '');
    }
  }, [article?.id, article?.categoryId, defaultCategoryId]);

  useEffect(() => {
    if (isUploadingCover) return;
    const next = coverImageUrl.trim();
    setCoverPreviewUrl(next);
    if (!next) {
      coverBlobUrlRef.current = null;
    }
  }, [coverImageUrl, isUploadingCover]);

  useEffect(() => {
    return () => {
      if (coverBlobUrlRef.current) {
        URL.revokeObjectURL(coverBlobUrlRef.current);
      }
    };
  }, []);

  const normalizeTag = (value: string) => value.trim();

  const rememberRecentTags = (list: string[]) => {
    const next = Array.from(new Set(list.map(normalizeTag).filter(Boolean))).slice(0, 12);
    setRecentTags(next);
    try {
      localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(next));
    } catch (err) {
      // Ignore storage errors.
    }
  };

  const addTag = (name: string) => {
    const cleaned = normalizeTag(name);
    if (!cleaned) return;
    setTags(prev => {
      if (prev.includes(cleaned)) return prev;
      return [...prev, cleaned];
    });
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const plainText = useMemo(() => {
    return content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_~`-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [content]);

  const contentStats = useMemo(() => {
    const chineseCount = (plainText.match(/[\u4e00-\u9fa5]/g) ?? []).length;
    const englishWords = (plainText.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g) ?? [])
      .length;
    const wordCount = chineseCount + englishWords;
    const minutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM));
    return { wordCount, minutes };
  }, [plainText]);

  const extractTitleFromMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    for (const line of lines) {
      const match = line.match(/^#\s+(.+)$/);
      if (match?.[1]) return match[1].trim();
    }
    return '';
  };

  const buildSummaryFromMarkdown = (markdown: string) => {
    const text = markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_~`-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!text) return '';
    return text.length > 160 ? `${text.slice(0, 160)}…` : text;
  };

  const handleAiSummary = () => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    const extractedTitle = extractTitleFromMarkdown(content);
    if (extractedTitle) {
      setTitle(extractedTitle);
    }
    const nextSummary = buildSummaryFromMarkdown(content);
    if (nextSummary) {
      setSummary(nextSummary);
    }
    setIsAiLoading(false);
  };

  const handleCoverSelect = async (file: File) => {
    setCoverUploadError('');
    const objectUrl = URL.createObjectURL(file);
    if (coverBlobUrlRef.current) {
      URL.revokeObjectURL(coverBlobUrlRef.current);
    }
    coverBlobUrlRef.current = objectUrl;
    setCoverPreviewUrl(objectUrl);
    setIsUploadingCover(true);
    try {
      const url = await onUploadCover(file);
      if (coverBlobUrlRef.current) {
        URL.revokeObjectURL(coverBlobUrlRef.current);
      }
      setCoverImageUrl(url);
      setCoverPreviewUrl(url);
      coverBlobUrlRef.current = null;
    } catch (err) {
      setCoverUploadError((err as Error).message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const tagMatches = useMemo(() => {
    const normalized = tagQuery.trim().toLowerCase();
    if (!normalized) return [];
    return availableTags.filter(tag => {
      if (tags.includes(tag.name)) return false;
      return (
        tag.name.toLowerCase().includes(normalized) ||
        tag.slug.toLowerCase().includes(normalized)
      );
    });
  }, [availableTags, tagQuery, tags]);

  const hasExactTag = useMemo(() => {
    const normalized = tagQuery.trim().toLowerCase();
    if (!normalized) return false;
    return (
      tags.some(tag => tag.toLowerCase() === normalized) ||
      availableTags.some(tag => tag.name.toLowerCase() === normalized || tag.slug.toLowerCase() === normalized)
    );
  }, [availableTags, tagQuery, tags]);

  const handleTagCreate = async () => {
    const raw = normalizeTag(tagQuery);
    if (!raw) return;
    try {
      const created = await onCreateTag({ name: raw });
      if (created) {
        setAvailableTags(prev => [created, ...prev.filter(tag => tag.id !== created.id)]);
        addTag(created.name);
      } else {
        addTag(raw);
      }
      setTagQuery('');
      setIsTagPickerOpen(false);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleFinalSave = (status: ArticleStatus) => {
    if (!isFormValid) return;
    const cleanTags = tags.map(tag => tag.trim()).filter(Boolean);
    rememberRecentTags(cleanTags);
    onSave({
      id: article?.id,
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
        <div className="lg:col-span-9 space-y-8">
          <div className={`bg-[#21222c]/60 backdrop-blur-md border-2 p-2 rounded-2xl shadow-xl transition-all ${title.trim() ? 'border-[#44475a] focus-within:border-[#bd93f9]' : 'border-[#ff5545]/30 focus-within:border-[#ff5545]'}`}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入文章标题（必填）"
              className="w-full bg-transparent p-6 text-2xl md:text-3xl font-bold text-[#f8f8f2] focus:outline-none placeholder-[#44475a]"
            />
          </div>
          {coverPreviewUrl.trim() && (
            <div className="rounded-2xl overflow-hidden border border-[#44475a] shadow-xl bg-[#21222c]/40">
              <img
                src={coverPreviewUrl}
                alt="文章封面预览"
                className="w-full h-auto max-h-[320px] object-cover"
              />
            </div>
          )}

          <div className={`bg-[#21222c]/60 backdrop-blur-md border-2 rounded-2xl overflow-hidden shadow-xl relative group transition-all ${content.trim() ? 'border-[#44475a] focus-within:border-[#bd93f9]' : 'border-[#ff5545]/30 focus-within:border-[#ff5545]'}`}>
            <div className="flex absolute top-4 right-6 gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <input type="file" accept=".md" onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) {
                   const reader = new FileReader();
                   reader.onload = (re) => setContent(re.target?.result as string);
                   reader.readAsText(file);
                }
              }} ref={markdownInputRef} className="hidden" />
              <button onClick={() => markdownInputRef.current?.click()} className="px-4 py-2 bg-[#44475a] text-[10px] font-bold text-[#f8f8f2] rounded-lg border border-[#6272a4] hover:bg-[#6272a4] transition-all uppercase tracking-widest">导入 MD</button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在此处输入内容（必填），支持 Markdown 语法"
              className="w-full h-[600px] lg:h-[750px] bg-transparent p-8 md:p-10 text-base md:text-lg font-mono text-[#f8f8f2] focus:outline-none resize-none placeholder-[#44475a] leading-relaxed custom-scrollbar"
            />
          </div>
        </div>

        {/* 右侧配置面板区域 */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-[#21222c]/80 backdrop-blur-md border-2 border-[#44475a] rounded-2xl px-5 py-6 shadow-xl">
            <h3 className="text-sm font-black text-[#9aa3d4] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#bd93f9] rounded-full shadow-[0_0_8px_#bd93f9]" />
              元数据配置
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="relative">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#282a36] border-2 border-[#44475a] py-2.5 px-3 text-[13px] text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] appearance-none cursor-pointer outline-none transition-all pr-10"
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
                  <input
                    type="text"
                    value={article.slug}
                    readOnly
                    className="w-full bg-[#282a36] border-2 border-[#44475a] py-2.5 px-3 text-[13px] text-[#6272a4] rounded-xl outline-none font-mono"
                  />
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={coverInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void handleCoverSelect(file);
                    e.currentTarget.value = '';
                  }}
                  className="hidden"
                />
                <div className="relative">
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => {
                      const next = e.target.value;
                      setCoverImageUrl(next);
                      if (!isUploadingCover) {
                        setCoverPreviewUrl(next.trim());
                        coverBlobUrlRef.current = null;
                      }
                    }}
                    placeholder="粘贴封面 URL"
                    className="w-full bg-[#282a36] border-2 border-[#44475a] py-2.5 pl-3 pr-12 text-[13px] text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a] shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg border border-[#44475a] bg-[#282a36] text-[#bd93f9] hover:text-[#ff79c6] hover:border-[#bd93f9]/60 hover:bg-[#282a36]/80 flex items-center justify-center transition-colors disabled:opacity-60"
                    title="上传封面"
                    aria-label="上传封面"
                  >
                    <Icons.Upload />
                  </button>
                </div>
                {isUploadingCover && (
                  <p className="text-sm text-[#bd93f9] mt-2 ml-1">封面上传中...</p>
                )}
                {coverUploadError && (
                  <p className="text-sm text-[#ff5545] mt-2 ml-1">{coverUploadError}</p>
                )}
              </div>
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.length > 0 &&
                    tags.map(tag => (
                      <span key={tag} className="relative inline-flex items-center px-3 py-1 bg-[#44475a]/40 border border-[#bd93f9]/30 text-[#bd93f9] text-xs font-black rounded-lg uppercase">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#282a36] border border-[#ff5545]/40 text-[#ff5545] text-[10px] leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={tagQuery}
                    onFocus={() => {
                      if (tagBlurTimerRef.current) window.clearTimeout(tagBlurTimerRef.current);
                      setIsTagPickerOpen(true);
                    }}
                    onBlur={() => {
                      if (tagBlurTimerRef.current) window.clearTimeout(tagBlurTimerRef.current);
                      tagBlurTimerRef.current = window.setTimeout(() => setIsTagPickerOpen(false), 120);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        if (tagMatches.length > 0) {
                          addTag(tagMatches[0].name);
                          setTagQuery('');
                          setIsTagPickerOpen(false);
                          return;
                        }
                        if (!hasExactTag && tagQuery.trim()) {
                          void handleTagCreate();
                        }
                      }
                    }}
                    onChange={e => setTagQuery(e.target.value)}
                    placeholder="输入标签名称..."
                    className="w-full bg-[#282a36] border-2 border-[#44475a] py-2.5 px-3 text-[13px] text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none transition-all placeholder-[#44475a] shadow-inner"
                  />
                </div>
                {isTagPickerOpen && (
                  <div className="mt-2 bg-[#1f202a] border border-[#44475a] rounded-xl p-3 shadow-xl space-y-2">
                    {tagQuery.trim() ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {tagMatches.map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                addTag(tag.name);
                                setTagQuery('');
                                setIsTagPickerOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#bd93f9]/40 text-[#bd93f9] hover:bg-[#bd93f9]/10"
                            >
                              #{tag.name}
                            </button>
                          ))}
                        </div>
                        {!hasExactTag && tagQuery.trim() && (
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleTagCreate}
                            className="w-full text-left px-3 py-2 rounded-lg border border-[#50fa7b]/40 text-[#50fa7b] text-[11px] font-black uppercase tracking-widest hover:bg-[#50fa7b]/10"
                          >
                            新建标签「{tagQuery.trim()}」
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-[#8d95c6] uppercase tracking-widest">最近使用</p>
                        {recentTags.length === 0 ? (
                          <p className="text-[11px] text-[#6272a4]">暂无记录</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {recentTags.slice(0, 6).map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  addTag(tag);
                                  setIsTagPickerOpen(false);
                                }}
                                className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-[#8be9fd]/40 text-[#8be9fd] hover:bg-[#8be9fd]/10"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="relative">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="概述文章核心内容..."
                    className="w-full h-32 bg-[#282a36] border-2 border-[#44475a] p-3 pr-12 text-[13px] text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none leading-relaxed placeholder-[#44475a] custom-scrollbar shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleAiSummary}
                    disabled={isAiLoading || !content.trim()}
                    className={`absolute right-3 top-3 w-9 h-9 rounded-lg border border-[#44475a] bg-[#282a36] text-[#bd93f9] hover:text-[#ff79c6] hover:border-[#bd93f9]/60 hover:bg-[#282a36]/80 flex items-center justify-center transition-colors disabled:opacity-60 ${isAiLoading ? 'animate-pulse' : ''}`}
                    title="AI 总结"
                    aria-label="AI 总结"
                  >
                    <Icons.Sparkles />
                  </button>
                </div>
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
                      {isEditingPublished ? '提交修改' : '立即发布'}
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

          <div className="bg-[#191a21]/60 backdrop-blur-sm p-5 rounded-2xl border-2 border-[#44475a] space-y-3 shadow-inner">
            <div className="flex justify-between text-[11px] font-mono uppercase font-black">
              <span className="text-[#8d95c6]">字数</span>
              <span className="text-[#f8f8f2]">{contentStats.wordCount}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono uppercase font-black">
              <span className="text-[#8d95c6]">预计阅读</span>
              <span className="text-[#f8f8f2]">{contentStats.minutes ? `${contentStats.minutes} 分钟` : '—'}</span>
            </div>
            <div className="flex justify-between text-[11px] font-mono uppercase font-black">
              <span className="text-[#8d95c6]">字节</span>
              <span className="text-[#f8f8f2]">{new Blob([content]).size}</span>
            </div>
            {!isFormValid && (
              <div className="pt-2">
                <p className="text-[10px] text-[#ff5545] font-black uppercase animate-pulse">标题与内容不能为空</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 放弃更改的二次确认 */}
      <ConfirmModal 
        isOpen={isDiscardConfirmOpen}
        title="放弃修改"
        message="未保存内容将丢失，确认放弃？"
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
