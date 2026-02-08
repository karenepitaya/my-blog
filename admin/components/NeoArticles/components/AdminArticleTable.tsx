import React, { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { useArticles, type NeoArticleRow } from '../../NeoShared/hooks/useArticles';
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  EyeOff,
  Loader2,
  Info,
  LayoutList,
  FileText,
  Users,
  Heart,
} from 'lucide-react';
import { ConfirmModal } from '../../NeoShared/ui/ConfirmModal';
import { useNeoAdminRuntime } from '../../NeoShared/runtime/NeoAdminRuntimeContext';
import { useNeoToast } from '../../NeoShared/ui/Toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { UserRole } from '../../../types';

type ConfirmAction =
  | { isOpen: false }
  | { isOpen: true; type: 'delete' | 'unpublish'; articleId: string; title: string; message: React.ReactNode };

type SortKey = 'date' | 'views' | 'title';
type RemarkFilter = 'all' | 'has' | 'none';

export const AdminArticleTable: React.FC = () => {
  const runtime = useNeoAdminRuntime();
  const toast = useNeoToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { articles: initialArticles, loading } = useArticles();

  const [articles, setArticles] = useState<NeoArticleRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [remarkFilter, setRemarkFilter] = useState<RemarkFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [confirmAction, setConfirmAction] = useState<ConfirmAction>({ isOpen: false });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoArticleId, setInfoArticleId] = useState<string | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search, pageSize, location.search, remarkFilter, sortKey]);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const selectedAuthorId = params.get('authorId') || '';

  const authors = useMemo(() => runtime.users.filter((u) => u.role === UserRole.AUTHOR), [runtime.users]);

  const filteredArticles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return articles
      .filter((article) => {
        const matchesAuthor = !selectedAuthorId || article.authorId === selectedAuthorId;
        if (!matchesAuthor) return false;

        const matchesFilter = filter === 'all' || article.status === filter;
        if (!matchesFilter) return false;

        if (remarkFilter === 'has' && !String(article.adminRemark ?? '').trim()) return false;
        if (remarkFilter === 'none' && String(article.adminRemark ?? '').trim()) return false;

        if (!term) return true;
        return (
          article.title.toLowerCase().includes(term) ||
          article.author.toLowerCase().includes(term) ||
          article.id.toLowerCase().includes(term) ||
          (article.tags ?? []).some((t) => String(t).toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (sortKey === 'views') return Number(b.views ?? 0) - Number(a.views ?? 0);
        if (sortKey === 'title') return String(a.title ?? '').localeCompare(String(b.title ?? ''), 'zh-Hans-CN');
        return String(b.date ?? '').localeCompare(String(a.date ?? ''));
      });
  }, [articles, filter, remarkFilter, search, selectedAuthorId, sortKey]);

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openInfo = async (article: NeoArticleRow) => {
    setInfoOpen(true);
    setInfoLoading(true);
    setInfoArticleId(article.id);
    setAdminRemark(article.adminRemark ?? '');
    try {
      const detail = await runtime.loadArticleDetail(article.id);
      setAdminRemark(detail?.adminRemark ?? article.adminRemark ?? '');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setInfoLoading(false);
    }
  };

  const saveAdminRemark = async () => {
    if (!infoArticleId) return;
    setSavingRemark(true);
    try {
      await runtime.updateArticleAdminMeta(infoArticleId, { remark: adminRemark });
      setInfoOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingRemark(false);
    }
  };

  const openConfirmDelete = (article: NeoArticleRow) => {
    setConfirmAction({
      isOpen: true,
      type: 'delete',
      articleId: article.id,
      title: '删除文章',
      message: (
        <div className="space-y-2">
          <div className="text-fg font-semibold">确认删除 “{article.title}” ？</div>
          <div className="text-muted text-xs">将进入删除流程（实现与后端契约一致）。</div>
        </div>
      ),
    });
  };

  const openConfirmUnpublish = (article: NeoArticleRow) => {
    setConfirmAction({
      isOpen: true,
      type: 'unpublish',
      articleId: article.id,
      title: '下架文章（丢入草稿箱）',
      message: (
        <div className="space-y-2">
          <div className="text-fg font-semibold">下架 “{article.title}”</div>
          <div className="text-muted text-xs">将该文章转为草稿状态（对应作者草稿箱）。</div>
        </div>
      ),
    });
  };

  const handleConfirm = async () => {
    if (!confirmAction.isOpen) return;
    if (confirmLoading) return;
    const id = confirmAction.articleId;
    try {
      setConfirmLoading(true);
      if (confirmAction.type === 'delete') {
        await runtime.deleteArticle(id);
      } else if (confirmAction.type === 'unpublish') {
        await runtime.unpublishArticle(id);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setConfirmAction({ isOpen: false });
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-4 sticky top-2 z-30 bg-fg/4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-[360px] group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-fg transition-colors"
              size={16}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题 / 作者 / ID / 标签..."
              className="w-full bg-surface border border-fg/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-fg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-colors placeholder:text-muted/80 shadow-inner font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:flex-1 lg:justify-end overflow-x-auto pb-1 lg:pb-0 min-w-0">
            <div className="flex items-center gap-3 min-w-max">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-secondary shrink-0" />
                <select
                  value={selectedAuthorId}
                  onChange={(e) => {
                    const next = e.target.value;
                    const nextParams = new URLSearchParams(location.search);
                    if (!next) nextParams.delete('authorId');
                    else nextParams.set('authorId', next);
                    const search = nextParams.toString();
                    navigate(`/admin/articles${search ? `?${search}` : ''}`);
                  }}
                  className="bg-surface border border-fg/10 rounded-lg px-3 py-2 text-xs text-fg font-mono outline-none hover:bg-fg/5 min-w-[180px]"
                  title="作者筛选"
                >
                  <option value="" className="bg-surface text-fg">
                    全部作者
                  </option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id} className="bg-surface text-fg">
                      @{a.username}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={filter}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next === 'all' || next === 'published' || next === 'draft' || next === 'archived') {
                    setFilter(next);
                  }
                }}
                className="bg-surface border border-fg/10 rounded-lg px-3 py-2 text-xs text-fg font-mono outline-none hover:bg-fg/5"
                title="状态筛选"
              >
                <option value="all" className="bg-surface text-fg">全部</option>
                <option value="published" className="bg-surface text-fg">已发布</option>
                <option value="draft" className="bg-surface text-fg">草稿/编辑中</option>
                <option value="archived" className="bg-surface text-fg">回收站</option>
              </select>

              <select
                value={remarkFilter}
                onChange={(e) => setRemarkFilter(e.target.value as RemarkFilter)}
                className="bg-surface border border-fg/10 rounded-lg px-3 py-2 text-xs text-fg font-mono outline-none hover:bg-fg/5"
                title="备注筛选"
              >
                <option value="all" className="bg-surface text-fg">备注：全部</option>
                <option value="has" className="bg-surface text-fg">备注：有</option>
                <option value="none" className="bg-surface text-fg">备注：无</option>
              </select>

              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="bg-surface border border-fg/10 rounded-lg px-3 py-2 text-xs text-fg font-mono outline-none hover:bg-fg/5"
                title="排序"
              >
                <option value="date" className="bg-surface text-fg">最新</option>
                <option value="views" className="bg-surface text-fg">浏览</option>
                <option value="title" className="bg-surface text-fg">标题</option>
              </select>

              <div className="flex items-center gap-2 bg-fg/4 border border-fg/10 rounded-lg px-3 py-2 text-xs font-mono text-muted whitespace-nowrap">
                <span>结果</span>
                <span className="text-fg font-semibold">{filteredArticles.length}</span>
                <span className="text-muted/70">/</span>
                <span>{articles.length}</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-fg/3 border-b border-fg/10">
              <tr>
                <th className="text-left py-4 pl-8 pr-4 text-xs font-semibold text-muted">文章</th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-muted">状态</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-muted">浏览</th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-muted">喜欢</th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-muted">分类</th>
                <th className="text-right py-4 pr-8 pl-4 text-xs font-semibold text-muted">操作</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-muted">加载中...</td>
                </tr>
              ) : paginatedArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-muted">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="opacity-20" />
                      <span>暂无数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedArticles.map((article) => (
                  <tr key={article.id} className="group hover:bg-fg/4 transition-colors duration-200">
                    <td className="py-5 pl-8 pr-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-base font-semibold text-fg group-hover:text-primary transition-colors line-clamp-1 pr-4" title={article.title}>
                          {article.title}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-muted font-mono">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {article.date}</span>
                          <span className="w-px h-3 bg-fg/10"></span>
                          <span className="text-muted/90">ID: {article.id}</span>
                          <span className="w-px h-3 bg-fg/10"></span>
                          <span className="text-muted/90">@{article.author}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-4">
                      <span
                        className={`
                          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border
                          ${article.status === 'published'
                            ? 'bg-success/10 text-success border-success/20'
                            : article.status === 'draft'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-danger/10 text-danger border-danger/20'}
                        `}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${article.status === 'published' ? 'bg-success' : article.status === 'draft' ? 'bg-warning' : 'bg-danger'}`}></span>
                        {article.status === 'published' ? '已发布' : article.status === 'draft' ? '草稿/编辑中' : '回收站'}
                      </span>
                    </td>

                    <td className="py-5 px-4 text-right">
                      <span className="text-sm font-semibold text-fg font-mono tracking-tight">{article.views.toLocaleString()}</span>
                    </td>

                    <td className="py-5 px-4 text-right">
                      <span className="inline-flex items-center justify-end gap-1.5 text-sm font-semibold text-fg font-mono tracking-tight">
                        <Heart size={14} className="text-danger" aria-hidden="true" />
                        {article.likesCount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-5 px-4 text-center">
                      <span className="inline-block text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-md">
                        {article.category}
                      </span>
                    </td>

                    <td className="py-5 pr-8 pl-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openInfo(article)}
                          disabled={confirmLoading}
                          className="p-2 rounded-lg bg-fg/5 hover:bg-fg/8 text-fg hover:text-fg border border-transparent hover:border-border transition-colors"
                          title="信息 / 备注"
                        >
                          <Info size={16} />
                        </button>

                        {article.status === 'published' && (
                          <button
                            onClick={() => openConfirmUnpublish(article)}
                            disabled={confirmLoading}
                            className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-transparent hover:border-purple-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            title="下架（丢入草稿箱）"
                          >
                            {confirmLoading &&
                            confirmAction.isOpen &&
                            confirmAction.type === 'unpublish' &&
                            confirmAction.articleId === article.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <EyeOff size={16} />
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => openConfirmDelete(article)}
                          disabled={confirmLoading}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          title="删除"
                        >
                          {confirmLoading &&
                          confirmAction.isOpen &&
                          confirmAction.type === 'delete' &&
                          confirmAction.articleId === article.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-surface/40 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <LayoutList size={16} />
              <span>共 <span className="text-fg font-semibold">{filteredArticles.length}</span> 条</span>
            </div>
            <div className="flex items-center gap-2 border-l border-border pl-6">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-surface border border-border rounded px-2 py-1 text-fg text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:bg-fg/5 transition-colors"
              >
                <option value={5} className="bg-surface text-fg">5</option>
                <option value={10} className="bg-surface text-fg">10</option>
                <option value={20} className="bg-surface text-fg">20</option>
                <option value={50} className="bg-surface text-fg">50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center bg-surface rounded-xl border border-border p-1 gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-fg/8 text-muted hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="px-3 text-xs font-mono font-semibold text-fg">
              {currentPage} / {totalPages || 1}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg hover:bg-fg/8 text-muted hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() => setConfirmAction({ isOpen: false })}
        onConfirm={handleConfirm}
        title={confirmAction.isOpen ? confirmAction.title : ''}
        message={confirmAction.isOpen ? confirmAction.message : ''}
        type={confirmAction.isOpen && confirmAction.type === 'delete' ? 'danger' : 'warning'}
        confirmText={confirmLoading ? '处理中...' : '确认'}
        cancelText="取消"
        cancelDisabled={confirmLoading}
        confirmDisabled={confirmLoading}
        closeDisabled={confirmLoading}
      />

      <ConfirmModal
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
        onConfirm={saveAdminRemark}
        title="文章信息 / 管理员备注"
        message={
          <div className="space-y-4">
            <div className="text-xs text-muted">
              {infoLoading ? '加载详情中...' : '仅管理员可见字段：备注。'}
            </div>
            <textarea
              value={adminRemark}
              onChange={(e) => setAdminRemark(e.target.value)}
              placeholder="填写管理员备注..."
              className="w-full min-h-[120px] bg-surface border border-border rounded-xl px-4 py-3 text-sm text-fg placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors resize-none"
            />
          </div>
        }
        type="info"
        confirmText={savingRemark ? '保存中...' : '保存'}
        cancelText="关闭"
        cancelDisabled={savingRemark}
        confirmDisabled={savingRemark}
        closeDisabled={savingRemark}
      />
    </div>
  );
};
