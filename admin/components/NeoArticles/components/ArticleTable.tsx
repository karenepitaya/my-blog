
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../NeoShared/ui/GlassCard';
import { useArticles, type NeoArticleRow } from '../../NeoShared/hooks/useArticles';
import { 
    Search, Edit3, Trash2, Filter, 
    ChevronLeft, ChevronRight,
    Clock, Rocket, RotateCcw, LayoutList, FileText, Loader2
} from 'lucide-react';
import { ConfirmModal } from '../../NeoShared/ui/ConfirmModal';
import { useNeoAdminRuntime } from '../../NeoShared/runtime/NeoAdminRuntimeContext';
import { useNeoToast } from '../../NeoShared/ui/Toast';

export const ArticleTable: React.FC = () => {
  const runtime = useNeoAdminRuntime();
  const toast = useNeoToast();
  const { articles: initialArticles, loading } = useArticles();
  
  // --- Local State for Simulation (Workflow) ---
  const [articles, setArticles] = useState<NeoArticleRow[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [workflowLoading, setWorkflowLoading] = useState(false);
  
  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // --- Confirm Modal State ---
  const [confirmAction, setConfirmAction] = useState<{
      isOpen: boolean;
      type: 'soft-delete' | 'hard-delete' | 'publish' | 'restore';
      articleId: string | null;
      title: string;
      message: string;
  }>({ isOpen: false, type: 'soft-delete', articleId: null, title: '', message: '' });

  const [activeWorkflow, setActiveWorkflow] = useState<{
      articleId: string;
      type: 'soft-delete' | 'hard-delete' | 'publish' | 'restore';
  } | null>(null);

  // Sync initial data
  useEffect(() => {
      setArticles(initialArticles);
  }, [initialArticles]);

  // --- Workflow Logic ---
  
  const handleWorkflow = async () => {
      if (!confirmAction.articleId) return;
      if (workflowLoading) return;

      const id = confirmAction.articleId;
      const current = articles.find(a => a.id === id);

      setWorkflowLoading(true);
      setActiveWorkflow({ articleId: id, type: confirmAction.type });
      try {
          switch (confirmAction.type) {
              case 'publish':
                  await runtime.publishArticle(id);
                  break;
              case 'soft-delete':
                  await runtime.deleteArticle(id);
                  break;
              case 'restore':
                  try {
                      await runtime.restoreArticle(id);
                  } catch (err) {
                      const message = (err as Error).message ?? '';
                      if (message.startsWith('ADMIN_DELETE_REQUIRES_RESTORE_REQUEST:')) {
                          await runtime.requestArticleRestore(id, null);
                          break;
                      }
                      throw err;
                  }
                  break;
          case 'hard-delete':
                  if (current?.status === 'archived') {
                      await runtime.confirmDeleteArticle(id);
                  } else {
                      await runtime.deleteArticle(id);
                  }
                  break;
           }
       } catch (err) {
          toast.error((err as Error).message);
       } finally {
           setWorkflowLoading(false);
           setActiveWorkflow(null);
           setConfirmAction(prev => ({ ...prev, isOpen: false }));
       }
  };

  const openConfirm = (type: 'soft-delete' | 'hard-delete' | 'publish' | 'restore', article: NeoArticleRow) => {
      let title = '';
      let message = '';

      switch(type) {
          case 'publish':
              title = '发布文章';
              message = `确认发布 "${article.title}"？文章将立即对所有访客可见。`;
              break;
          case 'soft-delete':
              title = '移至回收站';
              message = `文章 "${article.title}" 将被移至回收站，您可以在那里恢复它。`;
              break;
          case 'hard-delete':
              title = '彻底删除';
              message = `警告：文章 "${article.title}" 将被永久删除且无法恢复！`;
              break;
          case 'restore':
              title = '恢复文章';
              message = `文章 "${article.title}" 将恢复至草稿箱。`;
              break;
      }

      setConfirmAction({
          isOpen: true,
          type,
          articleId: article.id,
          title,
          message
      });
  };

  // --- Filtering & Pagination ---
  
  const filteredArticles = articles.filter(article => {
      const matchesFilter = filter === 'all' || article.status === filter;
      const term = search.trim().toLowerCase();
      if (!term) return matchesFilter;
      const matchesSearch =
        article.title.toLowerCase().includes(term) ||
        article.author.toLowerCase().includes(term) ||
        article.id.toLowerCase().includes(term) ||
        (article.tags ?? []).some(t => String(t).toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [filter, search, pageSize]);

  return (
    <div className="space-y-6">
      {/* --- Toolkit Bar --- */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-[#1a1b26]/40 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
        
        {/* Search */}
        <div className="relative w-full xl:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
          </div>
          <input 
            type="text" 
            placeholder="搜索文章标题 / 作者 / ID / 标签..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-11 pr-4 py-3 bg-[#0B0C15] border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-[#0B0C15] p-1.5 rounded-xl border border-white/10 shadow-sm overflow-x-auto">
            {[
              { id: 'all', label: '全部' },
              { id: 'published', label: '已发布' },
              { id: 'draft', label: '草稿箱' },
              { id: 'archived', label: '回收站' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`
                  px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                  ${filter === f.id 
                    ? 'bg-white/10 text-white shadow-md border border-white/10' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Main Table Container --- */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#1a1b26]/60 backdrop-blur-sm shadow-2xl">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-[500px] space-y-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <div className="text-slate-500 font-mono text-sm animate-pulse">正在加载数据矩阵...</div>
            </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B0C15]/90 border-b border-primary/20">
                <th className="py-6 pl-8 pr-4 text-base font-bold text-primary tracking-wide w-[45%]">文章标题</th>
                <th className="py-6 px-4 text-base font-bold text-primary tracking-wide w-[120px]">状态</th>
                <th className="py-6 px-4 text-base font-bold text-secondary tracking-wide w-[120px] text-right">浏览量</th>
                <th className="py-6 px-4 text-base font-bold text-secondary tracking-wide w-[120px] text-center">分类</th>
                <th className="py-6 pr-8 pl-4 text-base font-bold text-slate-300 tracking-wide w-[200px] text-right">操作控制</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedArticles.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                          <div className="flex flex-col items-center gap-2">
                              <FileText size={32} className="opacity-20"/>
                              <span>暂无数据</span>
                          </div>
                      </td>
                  </tr>
              ) : paginatedArticles.map((article) => (
                <tr key={article.id} className="group hover:bg-white/[0.04] transition-colors duration-200">
                  {/* Article Info */}
                  <td className="py-5 pl-8 pr-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-base font-bold text-slate-200 group-hover:text-primary transition-colors cursor-pointer line-clamp-1 pr-4" title={article.title}>
                          {article.title}
                      </span>
                      <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1.5"><Clock size={12}/> {article.date}</span>
                          <span className="w-px h-3 bg-white/10"></span>
                          <span className="text-slate-400">ID: {article.id}</span>
                          <span className="w-px h-3 bg-white/10"></span>
                          <span className="text-slate-400">@{article.author}</span>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-5 px-4">
                    <span className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm
                      ${article.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        article.status === 'draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-red-500/10 text-red-400 border-red-500/20'}
                    `}>
                      <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${article.status === 'published' ? 'bg-emerald-400' : article.status === 'draft' ? 'bg-amber-400' : 'bg-red-400'}`}></span>
                      {article.status === 'published' ? '已发布' : article.status === 'draft' ? '草稿' : '回收站'}
                    </span>
                  </td>

                  {/* Stats */}
                  <td className="py-5 px-4 text-right">
                    <span className="text-sm font-bold text-white font-mono tracking-tight">{article.views.toLocaleString()}</span>
                  </td>

                  {/* Category */}
                  <td className="py-5 px-4 text-center">
                    <span className="inline-block text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-3 py-1 rounded-md">
                      {article.category}
                    </span>
                  </td>

                  {/* Actions - WORKFLOW LOGIC */}
                  <td className="py-5 pr-8 pl-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      
                       {/* STATUS: PUBLISHED */}
                       {article.status === 'published' && (
                           <>
                             <button
                                 onClick={() => runtime.openEditorRoute({ id: article.id })}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-transparent hover:border-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                 title="编辑"
                             >
                                 <Edit3 size={16} />
                             </button>
                             <button 
                                 onClick={() => openConfirm('soft-delete', article)}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 border border-transparent hover:border-orange-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                                 title="移至回收站"
                             >
                                 {workflowLoading && activeWorkflow?.articleId === article.id && activeWorkflow?.type === 'soft-delete' ? (
                                     <Loader2 size={16} className="animate-spin" />
                                 ) : (
                                     <Trash2 size={16} />
                                 )}
                             </button>
                           </>
                       )}

                       {/* STATUS: DRAFT */}
                       {article.status === 'draft' && (
                           <>
                             <button 
                                 onClick={() => openConfirm('publish', article)}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                                 title="发布"
                             >
                                 {workflowLoading && activeWorkflow?.articleId === article.id && activeWorkflow?.type === 'publish' ? (
                                     <Loader2 size={16} className="animate-spin" />
                                 ) : (
                                     <Rocket size={16} />
                                 )}
                             </button>
                             <button
                                 onClick={() => runtime.openEditorRoute({ id: article.id })}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-transparent hover:border-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                 title="编辑"
                             >
                                 <Edit3 size={16} />
                             </button>
                             <button 
                                 onClick={() => openConfirm('hard-delete', article)}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                                 title="彻底删除"
                             >
                                 {workflowLoading && activeWorkflow?.articleId === article.id && activeWorkflow?.type === 'hard-delete' ? (
                                     <Loader2 size={16} className="animate-spin" />
                                 ) : (
                                     <Trash2 size={16} />
                                 )}
                             </button>
                           </>
                       )}

                       {/* STATUS: ARCHIVED */}
                       {article.status === 'archived' && (
                           <>
                             <button 
                                 onClick={() => openConfirm('restore', article)}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 text-secondary hover:text-white border border-transparent hover:border-secondary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                                 title="恢复至草稿"
                             >
                                 {workflowLoading && activeWorkflow?.articleId === article.id && activeWorkflow?.type === 'restore' ? (
                                     <Loader2 size={16} className="animate-spin" />
                                 ) : (
                                     <RotateCcw size={16} />
                                 )}
                             </button>
                             <button 
                                 onClick={() => openConfirm('hard-delete', article)}
                                 disabled={workflowLoading}
                                 className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                                 title="彻底删除"
                             >
                                 {workflowLoading && activeWorkflow?.articleId === article.id && activeWorkflow?.type === 'hard-delete' ? (
                                     <Loader2 size={16} className="animate-spin" />
                                 ) : (
                                     <Trash2 size={16} />
                                 )}
                             </button>
                           </>
                       )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        
        {/* --- Pagination Footer --- */}
        <div className="border-t border-white/10 bg-[#0B0C15]/60 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6 text-sm text-slate-500">
             <div className="flex items-center gap-2">
                 <LayoutList size={16} />
                 <span>共 <span className="text-white font-bold">{filteredArticles.length}</span> 篇</span>
             </div>
             
             {/* Page Size Selector */}
             <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                 <span>每页显示</span>
                 <select 
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-[#0F111A] border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-primary/50 cursor-pointer hover:bg-white/5 transition-colors"
                 >
                     <option value={5} className="bg-[#0F111A] text-white">5</option>
                     <option value={10} className="bg-[#0F111A] text-white">10</option>
                     <option value={20} className="bg-[#0F111A] text-white">20</option>
                     <option value={50} className="bg-[#0F111A] text-white">50</option>
                 </select>
             </div>
          </div>

          <div className="flex items-center bg-[#0F111A] rounded-xl border border-white/10 p-1 gap-1">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={16} />
            </button>
            
            <div className="px-3 text-xs font-mono font-bold text-slate-300">
                {currentPage} / {totalPages || 1}
            </div>

            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
                <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* --- Action Confirm Modal --- */}
      <ConfirmModal 
          isOpen={confirmAction.isOpen}
          onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
          onConfirm={handleWorkflow}
          title={confirmAction.title}
          message={confirmAction.message}
          type={confirmAction.type === 'hard-delete' ? 'danger' : confirmAction.type === 'soft-delete' ? 'warning' : 'success'}
          confirmText={workflowLoading ? '处理中...' : '确认操作'}
          cancelDisabled={workflowLoading}
          confirmDisabled={workflowLoading}
          closeDisabled={workflowLoading}
      />
    </div>
  );
};
