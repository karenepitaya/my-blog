import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Article, ArticleStatus, Category, User, UserRole } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface ArticleListProps {
  articles: Article[];
  categories: Category[];
  users: User[];
  user: User;
  onEdit: (article: Article) => void;
  onDelete: (id: string, input?: { reason?: string | null; graceDays?: number }) => void;
  onPublish: (id: string) => void;
  onRestore: (id: string) => void;
  onRequestRestore: (id: string, message?: string | null) => void;
  onConfirmDelete: (id: string) => void;
  onCreate: () => void;
  onUpdateAdminMeta: (id: string, input: { remark?: string | null }) => Promise<Article | null>;
  onLoadDetail: (id: string) => Promise<Article | null>;
}

const DEFAULT_GRACE_DAYS = 7;

const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  categories,
  users,
  user,
  onEdit,
  onDelete,
  onPublish,
  onRestore,
  onRequestRestore,
  onConfirmDelete,
  onCreate,
  onUpdateAdminMeta,
  onLoadDetail,
}) => {
  const [filter, setFilter] = useState<ArticleStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; title: string; status: ArticleStatus } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteGraceDays, setDeleteGraceDays] = useState(DEFAULT_GRACE_DAYS);
  const [purgeTarget, setPurgeTarget] = useState<Article | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<Article | null>(null);
  const [requestRestoreTarget, setRequestRestoreTarget] = useState<Article | null>(null);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [detailArticle, setDetailArticle] = useState<Article | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [isSavingRemark, setIsSavingRemark] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const isAdmin = user.role === UserRole.ADMIN;
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const selectedAuthorId = queryParams.get('authorId');

  const filteredArticles = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return articles.filter(a => {
      const isOwnerScope = isAdmin || a.authorId === user.id;
      if (!isOwnerScope) return false;
      const isStatusMatch =
        filter === 'ALL'
          ? true
          : !isAdmin && filter === ArticleStatus.DRAFT
            ? a.status === ArticleStatus.DRAFT || a.status === ArticleStatus.EDITING
            : a.status === filter;
      if (!isStatusMatch) return false;
      const isAuthorMatch = !selectedAuthorId || a.authorId === selectedAuthorId;
      if (!isAuthorMatch) return false;
      if (!normalizedTerm) return true;
      return (
        a.title.toLowerCase().includes(normalizedTerm) ||
        a.slug.toLowerCase().includes(normalizedTerm) ||
        a.id.toLowerCase().includes(normalizedTerm)
      );
    });
  }, [articles, filter, searchTerm, isAdmin, selectedAuthorId, user.id]);

  const getAuthorName = (authorId: string) => {
    return users.find(u => u.id === authorId)?.username || '未知作者';
  };

  const getCategoryName = (categoryId?: string | null) => {
    if (!categoryId) return '未归类';
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  const getStatusColor = (status: ArticleStatus) => {
    const normalized = !isAdmin && status === ArticleStatus.EDITING ? ArticleStatus.DRAFT : status;
    switch (normalized) {
      case ArticleStatus.PUBLISHED:
        return 'text-[#50fa7b] border-[#50fa7b]/30 bg-[#50fa7b]/10';
      case ArticleStatus.DRAFT:
        return 'text-[#f1fa8c] border-[#f1fa8c]/30 bg-[#f1fa8c]/10';
      case ArticleStatus.EDITING:
        return 'text-[#8be9fd] border-[#8be9fd]/30 bg-[#8be9fd]/10';
      case ArticleStatus.PENDING_DELETE:
        return 'text-[#ff5545] border-[#ff5545]/30 bg-[#ff5545]/10';
      default:
        return 'text-[#6272a4] border-[#44475a] bg-[#44475a]/10';
    }
  };

  const getStatusLabel = (status: ArticleStatus) => {
    const normalized = !isAdmin && status === ArticleStatus.EDITING ? ArticleStatus.DRAFT : status;
    switch (normalized) {
      case ArticleStatus.PUBLISHED:
        return '已发布';
      case ArticleStatus.DRAFT:
        return '草稿';
      case ArticleStatus.EDITING:
        return '编辑中';
      case ArticleStatus.PENDING_DELETE:
        return '待删除';
      default:
        return status;
    }
  };

  const openDeleteDialog = (article: Article) => {
    setDeleteDialog({ id: article.id, title: article.title, status: article.status });
    setDeleteReason(article.deleteReason ?? '');
    setDeleteGraceDays(DEFAULT_GRACE_DAYS);
  };

  const openDetail = async (article: Article) => {
    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(article.id);
      const next = detail ?? article;
      setDetailArticle(next);
      setAdminRemark(next.adminRemark ?? '');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSaveRemark = async () => {
    if (!detailArticle) return;
    setIsSavingRemark(true);
    try {
      const updated = await onUpdateAdminMeta(detailArticle.id, {
        remark: adminRemark.trim() ? adminRemark.trim() : null,
      });
      if (updated) {
        setDetailArticle(updated);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSavingRemark(false);
    }
  };

  const statusFilters: Array<{ label: string; value: ArticleStatus | 'ALL' }> = [
    { label: '全部', value: 'ALL' },
    { label: '已发布', value: ArticleStatus.PUBLISHED },
    { label: '草稿', value: ArticleStatus.DRAFT },
    ...(isAdmin ? [{ label: '编辑中', value: ArticleStatus.EDITING }] : []),
    { label: '回收站', value: ArticleStatus.PENDING_DELETE },
  ];
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="文章管理"
        motto={isAdmin ? '全站内容审核与生命周期管理。' : '撰写、发布并维护你的文章。'}
      />

      {isAdmin && (
        <div className="mb-8 p-4 bg-[#21222c] border border-[#44475a] rounded-xl animate-in slide-in-from-top-2 duration-500">
          <p className="text-sm text-[#6272a4] font-black uppercase mb-3 ml-2 tracking-widest">
            作者筛选
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/articles')}
                className={`px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold uppercase transition-all active:scale-95 ${
                  !selectedAuthorId
                    ? 'bg-[#bd93f9] text-[#282a36]'
                    : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
                }`}
            >
              全部作者
            </button>
            {users
              .filter(u => u.role === UserRole.AUTHOR)
              .map(u => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/articles?authorId=${u.id}`)}
                  className={`px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold uppercase transition-all active:scale-95 ${
                    selectedAuthorId === u.id
                      ? 'bg-[#bd93f9] text-[#282a36]'
                      : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
                  }`}
                >
                  @{u.username}
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="搜索标题 / slug / ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#21222c] border border-[#44475a] px-6 py-4 rounded-xl text-base text-[#f8f8f2] focus:border-[#bd93f9] focus:outline-none transition-all placeholder-[#44475a] shadow-inner font-mono"
        />
        {!isAdmin && (
          <button
            onClick={onCreate}
            className="flex items-center justify-center gap-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] px-8 py-4 rounded-xl font-black text-sm lg:text-base uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/20 whitespace-nowrap"
          >
            <Icons.Plus />
            新建文章
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-4">
        {statusFilters.map(s => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value as any)}
            className={`px-5 py-3 text-xs lg:text-sm font-semibold rounded-xl border transition-all whitespace-nowrap uppercase tracking-widest ${
              filter === s.value
                ? 'bg-[#bd93f9] text-[#282a36] border-[#bd93f9] shadow-lg shadow-purple-500/20'
                : 'text-[#6272a4] border-[#44475a] hover:text-[#f8f8f2] hover:bg-[#44475a]/30'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-[#21222c] border border-[#44475a] rounded-xl overflow-hidden shadow-2xl">
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#44475a] bg-[#282a36]/30">
                <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">标题</th>
                <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">作者</th>
                <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">状态</th>
                <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">分类</th>
                <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em] text-right">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#44475a]">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-[#6272a4] font-mono text-xs uppercase italic">
                    暂无匹配文章。
                  </td>
                </tr>
              ) : (
                filteredArticles.map(article => (
                  <tr key={article.id} className="group hover:bg-[#44475a]/20 transition-all duration-300">
                    <td className="py-5 px-6">
                      <p className="text-base lg:text-lg font-semibold text-[#f8f8f2] group-hover:text-[#bd93f9] transition-colors">
                        {article.title}
                      </p>
                      <p className="text-xs lg:text-sm text-[#6272a4] font-mono mt-1 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                        ID: {article.id.substring(0, 8)} | {new Date(article.updatedAt).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-sm lg:text-base text-[#f8f8f2]/80 font-semibold italic">
                        {getAuthorName(article.authorId)}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-2">
                        <span className={`text-xs lg:text-sm px-2 py-0.5 rounded border font-semibold uppercase ${getStatusColor(article.status)}`}>
                          {getStatusLabel(article.status)}
                        </span>
                        {article.restoreRequestedAt && (
                          <span className="text-xs lg:text-sm text-[#ffb86c] font-semibold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                            有恢复申请
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-xs lg:text-sm text-[#6272a4] font-mono bg-[#282a36] px-2 py-1 rounded">
                        {getCategoryName(article.categoryId)}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => openDetail(article)}
                              className="p-2 text-[#8be9fd] hover:text-[#f8f8f2] hover:bg-[#8be9fd]/10 rounded-lg transition-colors transition-transform active:scale-95"
                              title="查看详情"
                            >
                              <Icons.Edit />
                            </button>
                            {article.status !== ArticleStatus.PENDING_DELETE && (
                              <button
                                onClick={() => openDeleteDialog(article)}
                                className="p-2 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-colors transition-transform active:scale-95"
                                title="删除"
                              >
                                <Icons.Trash />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            {(article.status === ArticleStatus.DRAFT || article.status === ArticleStatus.EDITING) && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await onPublish(article.id);
                                    } catch (err) {
                                      alert((err as Error).message);
                                    }
                                  }}
                                  className="p-2 text-[#6272a4] hover:text-[#50fa7b] hover:bg-[#50fa7b]/10 rounded-lg transition-colors transition-transform active:scale-95"
                                  title="发布"
                                >
                                  <Icons.Check />
                                </button>
                              </>
                            )}
                            {article.status !== ArticleStatus.PENDING_DELETE && (
                              <button
                                onClick={() => onEdit(article)}
                                className="p-2 text-[#6272a4] hover:text-[#8be9fd] hover:bg-[#8be9fd]/10 rounded-lg transition-colors transition-transform active:scale-95"
                                title="编辑"
                              >
                                <Icons.Edit />
                              </button>
                            )}
                            {article.status === ArticleStatus.PENDING_DELETE ? (
                              article.deletedByRole === 'admin' ? (
                                <button
                                  onClick={() => {
                                    if (!article.restoreRequestedAt) setRequestRestoreTarget(article);
                                  }}
                                  disabled={!!article.restoreRequestedAt}
                                  className="px-3 py-1 bg-[#282a36] border border-[#ff79c6]/30 text-[#ff79c6] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#ff79c6]/10 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                                  title="申请恢复"
                                >
                                  {article.restoreRequestedAt ? '已申请' : '申请恢复'}
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setRestoreTarget(article)}
                                    className="px-3 py-1 bg-[#282a36] border border-[#50fa7b]/30 text-[#50fa7b] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#50fa7b]/10 active:scale-95"
                                    title="恢复"
                                  >
                                    恢复
                                  </button>
                                  <button
                                    onClick={() => setPurgeTarget(article)}
                                    className="px-3 py-1 bg-[#282a36] border border-[#ff5545]/30 text-[#ff5545] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#ff5545]/10 active:scale-95"
                                    title="彻底删除"
                                  >
                                    彻底删除
                                  </button>
                                </>
                              )
                            ) : (
                              <button
                                onClick={() => openDeleteDialog(article)}
                                className="p-2 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-colors transition-transform active:scale-95"
                                title="删除"
                              >
                                <Icons.Trash />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-[#44475a]">
          {filteredArticles.length === 0 ? (
            <div className="py-16 text-center text-[#6272a4] font-mono text-xs uppercase italic">暂无文章</div>
          ) : (
            filteredArticles.map(article => (
              <div key={article.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-[#f8f8f2]">{article.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#bd93f9] font-semibold uppercase tracking-widest">
                        {getAuthorName(article.authorId)}
                      </span>
                      <span className="text-[8px] text-[#6272a4] font-mono uppercase">
                        ID: {article.id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[8px] px-2 py-0.5 rounded border font-black uppercase shrink-0 ${getStatusColor(article.status)}`}>
                    {getStatusLabel(article.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-[#6272a4] font-mono bg-[#282a36] px-2 py-1 rounded">
                    {getCategoryName(article.categoryId)}
                  </span>
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <button
                        onClick={() => openDetail(article)}
                        className="p-3 bg-[#44475a]/30 rounded-lg border border-[#44475a] text-[#8be9fd]"
                      >
                        <Icons.Edit />
                      </button>
                    ) : article.status === ArticleStatus.PENDING_DELETE ? (
                      article.deletedByRole === 'admin' ? (
                        <button
                          onClick={() => {
                            if (!article.restoreRequestedAt) setRequestRestoreTarget(article);
                          }}
                          disabled={!!article.restoreRequestedAt}
                          className="px-3 py-2 bg-[#282a36] border border-[#ff79c6]/30 text-[#ff79c6] text-xs font-semibold rounded uppercase disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {article.restoreRequestedAt ? '已申请' : '申请恢复'}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setRestoreTarget(article)}
                            className="px-3 py-2 bg-[#282a36] border border-[#50fa7b]/30 text-[#50fa7b] text-xs font-semibold rounded uppercase"
                          >
                            恢复
                          </button>
                          <button
                            onClick={() => setPurgeTarget(article)}
                            className="px-3 py-2 bg-[#282a36] border border-[#ff5545]/30 text-[#ff5545] text-xs font-semibold rounded uppercase"
                          >
                            删除
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        {(article.status === ArticleStatus.DRAFT || article.status === ArticleStatus.EDITING) && (
                          <button
                            onClick={async () => {
                              try {
                                await onPublish(article.id);
                              } catch (err) {
                                alert((err as Error).message);
                              }
                            }}
                            className="p-3 bg-[#44475a]/30 rounded-lg border border-[#44475a] text-[#50fa7b]"
                          >
                            <Icons.Check />
                          </button>
                        )}
                        {article.status !== ArticleStatus.PENDING_DELETE && (
                          <button
                            onClick={() => onEdit(article)}
                            className="p-3 bg-[#44475a]/30 rounded-lg border border-[#44475a] text-[#8be9fd]"
                          >
                            <Icons.Edit />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteDialog(article)}
                          className="p-3 bg-[#44475a]/30 rounded-lg border border-[#44475a] text-[#ff5545]"
                        >
                          <Icons.Trash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {deleteDialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-[#44475a]">
              <h4 className="text-sm font-black text-[#f8f8f2] uppercase tracking-widest">删除文章</h4>
              <p className="text-xs text-[#6272a4] mt-2 font-mono">{deleteDialog.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                  删除原因（可选）
                </label>
                <textarea
                  value={deleteReason}
                  onChange={e => setDeleteReason(e.target.value)}
                  className="w-full h-20 bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none"
                  placeholder="记录删除原因"
                />
              </div>
              {deleteDialog.status === ArticleStatus.PUBLISHED && (
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                    回收站保留天数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={deleteGraceDays}
                    onChange={e => setDeleteGraceDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none font-mono"
                  />
                </div>
              )}
              {deleteDialog.status !== ArticleStatus.PUBLISHED && (
                <p className="text-xs text-[#6272a4] font-mono">
                  草稿或编辑中内容将立即清除，不进入回收站。
                </p>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-2 border-t border-[#44475a]">
              <button
                onClick={() => setDeleteDialog(null)}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!deleteDialog) return;
                  try {
                    await onDelete(deleteDialog.id, {
                      reason: deleteReason.trim() ? deleteReason.trim() : null,
                      graceDays: deleteDialog.status === ArticleStatus.PUBLISHED ? deleteGraceDays : undefined,
                    });
                  } catch (err) {
                    alert((err as Error).message);
                  } finally {
                    setDeleteDialog(null);
                  }
                }}
                className="flex-1 py-3 bg-[#ff5545] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {requestRestoreTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-[#44475a]">
              <h4 className="text-sm font-black text-[#f8f8f2] uppercase tracking-widest">申请恢复</h4>
              <p className="text-xs text-[#6272a4] mt-2 font-mono">{requestRestoreTarget.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                说明（可选）
              </label>
              <textarea
                value={restoreMessage}
                onChange={e => setRestoreMessage(e.target.value)}
                className="w-full h-20 bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none"
                placeholder="说明恢复原因"
              />
            </div>
            <div className="flex gap-3 p-6 pt-2 border-t border-[#44475a]">
              <button
                onClick={() => setRequestRestoreTarget(null)}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!requestRestoreTarget) return;
                  try {
                    await onRequestRestore(requestRestoreTarget.id, restoreMessage.trim() || null);
                  } catch (err) {
                    alert((err as Error).message);
                  } finally {
                    setRestoreMessage('');
                    setRequestRestoreTarget(null);
                  }
                }}
                className="flex-1 py-3 bg-[#ff79c6] hover:bg-[#bd93f9] text-[#282a36] font-black text-xs rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!restoreTarget}
        title="确认恢复"
        message="将文章恢复到已发布状态。"
        confirmText="确认恢复"
        onConfirm={async () => {
          if (!restoreTarget) return;
          try {
            await onRestore(restoreTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setRestoreTarget(null);
          }
        }}
        onCancel={() => setRestoreTarget(null)}
      />

      <ConfirmModal
        isOpen={!!purgeTarget}
        title="彻底删除"
        message="此操作不可逆，确认后将彻底移除文章。"
        confirmText="确认删除"
        onConfirm={async () => {
          if (!purgeTarget) return;
          try {
            await onConfirmDelete(purgeTarget.id);
          } catch (err) {
            alert((err as Error).message);
          } finally {
            setPurgeTarget(null);
          }
        }}
        onCancel={() => setPurgeTarget(null)}
      />

      {detailArticle && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#44475a]">
              <div>
                <h3 className="text-lg font-black text-[#f8f8f2]">文章详情</h3>
                <p className="text-xs text-[#6272a4] font-mono uppercase mt-1">{detailArticle.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {isLoadingDetail && (
                  <span className="text-xs text-[#6272a4] font-mono uppercase">同步中...</span>
                )}
                <button
                  onClick={() => setDetailArticle(null)}
                  className="text-[#6272a4] hover:text-[#f8f8f2] text-xs font-black"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <h4 className="text-lg font-black text-[#f8f8f2]">{detailArticle.title}</h4>
                <p className="text-xs text-[#6272a4] font-mono uppercase">
                  作者: {getAuthorName(detailArticle.authorId)} · 分类: {getCategoryName(detailArticle.categoryId)}
                </p>
                {detailArticle.coverImageUrl && (
                  <img
                    src={detailArticle.coverImageUrl}
                    alt={detailArticle.title}
                    className="w-full h-40 object-cover rounded-xl border border-[#44475a]"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {(detailArticle.tags ?? []).length === 0 ? (
                    <span className="text-xs text-[#6272a4]">无标签</span>
                  ) : (
                    detailArticle.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded border font-semibold uppercase tracking-widest text-[#bd93f9] border-[#bd93f9]/30 bg-[#bd93f9]/10"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
                <p className="text-sm text-[#f8f8f2]/70 leading-relaxed">
                  {detailArticle.summary ?? '暂无摘要'}
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">
                    管理备注
                  </label>
                  <textarea
                    value={adminRemark}
                    onChange={e => setAdminRemark(e.target.value)}
                    placeholder="填写内部备注..."
                    className="w-full h-24 bg-[#282a36] border-2 border-[#44475a] p-4 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none"
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDetailArticle(null)}
                    className="px-4 py-2 text-xs font-black text-[#6272a4] uppercase"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleSaveRemark}
                    disabled={isSavingRemark}
                    className="px-6 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest disabled:opacity-60"
                  >
                    {isSavingRemark ? '保存中...' : '保存备注'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleList;
