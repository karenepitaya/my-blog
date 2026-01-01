import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Article, Category, CategoryStatus, User, UserRole } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface CategoryDetailProps {
  categories: Category[];
  articles: Article[];
  user: User;
  onLoadDetail: (id: string) => Promise<Category | null>;
  onSaveCategory: (input: Partial<Category>) => Promise<void>;
  onUploadCover: (file: File) => Promise<string>;
  onMoveArticle: (id: string, categoryId: string | null) => Promise<void>;
  onEditArticle: (article: Article) => void;
  onCreateArticle: (categoryId: string) => void;
  onDeleteArticle: (id: string) => Promise<void>;
}

const CategoryDetail: React.FC<CategoryDetailProps> = ({
  categories,
  articles,
  user,
  onLoadDetail,
  onSaveCategory,
  onUploadCover,
  onMoveArticle,
  onEditArticle,
  onCreateArticle,
  onDeleteArticle,
}) => {
  const params = useParams();
  const navigate = useNavigate();
  const categoryId = params.id ?? '';
  const [category, setCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [movingArticleId, setMovingArticleId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isAuthor = user.role === UserRole.AUTHOR;
  const canEdit = isAuthor && (category?.status ?? CategoryStatus.ACTIVE) === CategoryStatus.ACTIVE;

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    setIsLoading(true);
    onLoadDetail(categoryId)
      .then(detail => {
        if (!active) return;
        if (detail) {
          setCategory(detail);
          setFormData({
            id: detail.id,
            name: detail.name,
            slug: detail.slug,
            description: detail.description ?? '',
            coverImageUrl: detail.coverImageUrl ?? '',
          });
        }
      })
      .catch(err => {
        alert((err as Error).message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [categoryId, onLoadDetail]);

  const categoryArticles = useMemo(
    () => articles.filter(article => article.categoryId === categoryId),
    [articles, categoryId]
  );

  const selectableCategories = useMemo(
    () =>
      categories.filter(cat => {
        if (cat.status && cat.status !== CategoryStatus.ACTIVE) return false;
        if (isAuthor && cat.ownerId && cat.ownerId !== user.id) return false;
        return true;
      }),
    [categories, isAuthor, user.id]
  );

  const handleCoverSelect = async (file: File) => {
    setCoverError('');
    setIsUploadingCover(true);
    try {
      const url = await onUploadCover(file);
      setFormData(prev => ({ ...prev, coverImageUrl: url }));
    } catch (err) {
      setCoverError((err as Error).message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('请填写专栏名称。');
      return;
    }
    setIsSaving(true);
    try {
      await onSaveCategory({
        id: categoryId,
        name: formData.name?.trim(),
        slug: formData.slug?.trim() || undefined,
        description: formData.description?.trim() || null,
        coverImageUrl: formData.coverImageUrl?.trim() || null,
      });
      const detail = await onLoadDetail(categoryId);
      if (detail) setCategory(detail);
      setIsEditing(false);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveArticle = async (article: Article, nextCategoryId: string | null) => {
    if (movingArticleId) return;
    if ((article.categoryId ?? '') === (nextCategoryId ?? '')) return;
    setMovingArticleId(article.id);
    try {
      await onMoveArticle(article.id, nextCategoryId);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setMovingArticleId(null);
    }
  };

  if (!categoryId) {
    return (
      <div className="text-center text-[#6272a4] font-mono text-sm py-20">未找到专栏。</div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      <PageHeader
        title="专栏详情"
        motto="独立管理专栏内容与文章流转。"
        action={
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="px-4 py-2 rounded-xl border border-[#44475a] text-[#6272a4] text-sm font-black uppercase tracking-widest hover:text-[#f8f8f2] hover:border-[#bd93f9]"
          >
            返回列表
          </button>
        }
      />

      {isLoading ? (
        <div className="text-[#6272a4] font-mono text-sm uppercase tracking-widest animate-pulse">
          同步专栏信息...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div className="bg-[#21222c] border border-[#44475a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-[#f8f8f2]">{category?.name ?? '未命名专栏'}</h2>
                  <p className="text-[10px] text-[#6272a4] font-mono uppercase mt-2">
                    /{category?.slug ?? 'unknown'}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(prev => !prev)}
                    className="px-4 py-2 rounded-xl border border-[#8be9fd]/40 text-[#8be9fd] text-[10px] font-black uppercase tracking-widest hover:bg-[#8be9fd]/10"
                  >
                    {isEditing ? '关闭编辑' : '编辑专栏'}
                  </button>
                )}
              </div>
              <p className="text-base md:text-lg text-[#f8f8f2]/80 mt-4 leading-relaxed">
                {category?.description || '暂无描述。'}
              </p>
              {category?.coverImageUrl && (
                <div className="mt-6 rounded-2xl overflow-hidden border border-[#44475a]">
                  <img src={category.coverImageUrl} alt="专栏封面" className="w-full h-auto max-h-[260px] object-cover" />
                </div>
              )}
            </div>

            {canEdit && isEditing && (
              <div className="bg-[#1f202a] border border-[#44475a] rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">名称</label>
                    <input
                      value={formData.name ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="专栏名称"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">Slug</label>
                    <input
                      value={formData.slug ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="category-slug"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">简介</label>
                    <input
                      value={formData.description ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="专栏简介"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest">封面</label>
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={isUploadingCover}
                      className="px-3 py-2 rounded-lg border border-[#bd93f9]/40 text-[#bd93f9] text-[10px] font-black uppercase tracking-widest hover:bg-[#bd93f9]/10 disabled:opacity-60"
                    >
                      {isUploadingCover ? '上传中' : '上传封面'}
                    </button>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={coverInputRef}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) void handleCoverSelect(file);
                      e.currentTarget.value = '';
                    }}
                    className="hidden"
                  />
                  <input
                    value={formData.coverImageUrl ?? ''}
                    onChange={e => setFormData(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                    placeholder="粘贴封面 URL"
                  />
                  {coverError && <p className="text-[10px] text-[#ff5545]">{coverError}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#44475a]">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-[10px] font-black text-[#6272a4] uppercase tracking-widest"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-[10px] rounded-xl uppercase tracking-[0.2em] disabled:opacity-60"
                  >
                    {isSaving ? '保存中...' : '保存更新'}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-[#21222c] border border-[#44475a] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-[#f8f8f2] uppercase tracking-[0.2em]">专栏文章</h3>
                {isAuthor && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateArticle(categoryId);
                      navigate('/articles');
                    }}
                    className="px-4 py-2 rounded-xl bg-[#50fa7b] text-[#282a36] text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    <Icons.Plus />
                    新建文章
                  </button>
                )}
              </div>
              {categoryArticles.length === 0 ? (
                <div className="text-center text-[#6272a4] font-mono text-xs uppercase italic py-10">
                  暂无文章。
                </div>
              ) : (
                <div className="space-y-3">
                  {categoryArticles.map(article => (
                    <div
                      key={article.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1f202a] border border-[#44475a] rounded-xl px-4 py-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm text-[#f8f8f2] font-bold">{article.title}</p>
                        <p className="text-[10px] text-[#6272a4] font-mono uppercase">
                          {article.updatedAt?.split('T')[0] ?? '—'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={article.categoryId ?? ''}
                          onChange={e => handleMoveArticle(article, e.target.value || null)}
                          disabled={!isAuthor || movingArticleId === article.id}
                          className="min-w-[150px] text-[10px]"
                        >
                          <option value="">未归类</option>
                          {selectableCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => {
                              onEditArticle(article);
                              navigate('/articles');
                            }}
                            className="px-3 py-1 rounded-lg border border-[#8be9fd]/40 text-[#8be9fd] text-[10px] font-black uppercase tracking-widest hover:bg-[#8be9fd]/10"
                          >
                            编辑
                          </button>
                        )}
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(article)}
                            className="px-3 py-1 rounded-lg border border-[#ff5545]/40 text-[#ff5545] text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5545]/10"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1f202a] border border-[#44475a] rounded-2xl p-5 shadow-xl">
              <p className="text-sm text-[#6272a4] uppercase tracking-widest mb-2">状态</p>
              <p className="text-lg font-black text-[#f8f8f2]">
                {category?.status === CategoryStatus.PENDING_DELETE ? '待删除' : '正常'}
              </p>
              <p className="text-sm text-[#6272a4] mt-4">文章数量</p>
              <p className="text-lg font-black text-[#f8f8f2]">{categoryArticles.length}</p>
            </div>
            {category?.deleteScheduledAt && (
              <div className="bg-[#1f202a] border border-[#ffb86c]/40 rounded-2xl p-5 shadow-xl">
                <p className="text-sm text-[#ffb86c] uppercase tracking-widest">删除时间</p>
                <p className="text-lg font-black text-[#f8f8f2]">
                  {new Date(category.deleteScheduledAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="删除文章"
        message={`确认删除文章「${deleteTarget?.title ?? ''}」？`}
        confirmText="确认删除"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await onDeleteArticle(deleteTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CategoryDetail;
