import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Article, ArticleStatus, Category, CategoryStatus, User, UserStatus } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

type ResourceType = 'article' | 'user' | 'category';

interface RecycleBinProps {
  articles: Article[];
  categories: Category[];
  users: User[];
  onRestore: (id: string, type: ResourceType) => void;
  onPurge: (id: string, type: ResourceType) => void;
}

interface ActionState {
  id: string;
  type: ResourceType;
  title: string;
}

const RecycleBin: React.FC<RecycleBinProps> = ({ articles, categories, users, onRestore, onPurge }) => {
  const [restoreTarget, setRestoreTarget] = useState<ActionState | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<ActionState | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const activeType = (queryParams.get('type') ?? 'author') as 'author' | 'category' | 'article';

  const deletedUsers = useMemo(
    () => users.filter(u => u.status === UserStatus.PENDING_DELETE),
    [users]
  );
  const deletedCategories = useMemo(
    () => categories.filter(c => c.status === CategoryStatus.PENDING_DELETE),
    [categories]
  );
  const deletedArticles = useMemo(
    () => articles.filter(a => a.status === ArticleStatus.PENDING_DELETE),
    [articles]
  );

  const emptyState = {
    author: deletedUsers.length === 0,
    category: deletedCategories.length === 0,
    article: deletedArticles.length === 0,
  };

  const navButtons = [
    { type: 'author', label: '作者回收站' },
    { type: 'category', label: '分类回收站' },
    { type: 'article', label: '文章回收站' },
  ] as const;

  const getUserLabel = (id: string) => users.find(u => u.id === id)?.username ?? 'UNKNOWN';
  const getCategoryLabel = (id?: string | null) =>
    categories.find(c => c.id === id)?.name ?? (id ? id.slice(0, 6) : '未归类');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="系统回收站"
        motto="资源在此进入等待期，确认后才会彻底删除。"
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {navButtons.map(button => (
          <button
            key={button.type}
            onClick={() => navigate(`/recycle-bin?type=${button.type}`)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeType === button.type
                ? 'bg-[#bd93f9] text-[#282a36]'
                : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      {activeType === 'author' && (
        <div className="bg-[#21222c] border border-[#44475a] rounded-xl overflow-hidden shadow-xl mb-10">
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#44475a] bg-[#282a36]/50">
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">作者</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">计划删除</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#44475a]">
                {emptyState.author ? (
                  <tr>
                    <td colSpan={3} className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">
                      回收站暂无作者_
                    </td>
                  </tr>
                ) : (
                  deletedUsers.map(item => (
                    <tr key={item.id} className="hover:bg-[#ff5545]/5 transition-all duration-300 group">
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-[#ff5545]/80 line-through decoration-1 tracking-tight">
                          {item.username}
                        </p>
                        <p className="text-[10px] text-[#6272a4] font-mono mt-1.5 uppercase">
                          NODE_ID: {item.id.substring(0, 16)}...
                        </p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-mono text-[#6272a4]">
                          {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setRestoreTarget({ id: item.id, title: item.username, type: 'user' })}
                            className="p-2 text-[#6272a4] hover:text-[#50fa7b] hover:bg-[#50fa7b]/10 rounded-lg transition-all active:scale-90"
                            title="还原作者"
                          >
                            <Icons.Restore />
                          </button>
                          <button
                            onClick={() => setPurgeTarget({ id: item.id, title: item.username, type: 'user' })}
                            className="p-2 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-all active:scale-90"
                            title="彻底删除"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#44475a]">
            {emptyState.author ? (
              <div className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">回收站暂无作者_</div>
            ) : (
              deletedUsers.map(item => (
                <div key={item.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-[#ff5545]/80 line-through">{item.username}</h4>
                      <span className="text-[10px] text-[#6272a4] uppercase font-mono mt-1 block">
                        计划删除: {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRestoreTarget({ id: item.id, title: item.username, type: 'user' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#50fa7b] border border-[#44475a]"
                      >
                        <Icons.Restore />
                      </button>
                      <button
                        onClick={() => setPurgeTarget({ id: item.id, title: item.username, type: 'user' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#ff5545] border border-[#44475a]"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeType === 'category' && (
        <div className="bg-[#21222c] border border-[#44475a] rounded-xl overflow-hidden shadow-xl mb-10">
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#44475a] bg-[#282a36]/50">
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">分类</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">作者</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">计划删除</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#44475a]">
                {emptyState.category ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">
                      回收站暂无分类_
                    </td>
                  </tr>
                ) : (
                  deletedCategories.map(item => (
                    <tr key={item.id} className="hover:bg-[#ff5545]/5 transition-all duration-300 group">
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-[#ff5545]/80 line-through decoration-1 tracking-tight">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#6272a4] font-mono mt-1.5 uppercase">/{item.slug}</p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-mono text-[#6272a4]">
                          {item.ownerId ? getUserLabel(item.ownerId) : '系统'}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-mono text-[#6272a4]">
                          {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setRestoreTarget({ id: item.id, title: item.name, type: 'category' })}
                            className="p-2 text-[#6272a4] hover:text-[#50fa7b] hover:bg-[#50fa7b]/10 rounded-lg transition-all active:scale-90"
                            title="还原分类"
                          >
                            <Icons.Restore />
                          </button>
                          <button
                            onClick={() => setPurgeTarget({ id: item.id, title: item.name, type: 'category' })}
                            className="p-2 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-all active:scale-90"
                            title="彻底删除"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#44475a]">
            {emptyState.category ? (
              <div className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">回收站暂无分类_</div>
            ) : (
              deletedCategories.map(item => (
                <div key={item.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-[#ff5545]/80 line-through">{item.name}</h4>
                      <span className="text-[10px] text-[#6272a4] uppercase font-mono mt-1 block">
                        作者: {item.ownerId ? getUserLabel(item.ownerId) : '系统'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRestoreTarget({ id: item.id, title: item.name, type: 'category' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#50fa7b] border border-[#44475a]"
                      >
                        <Icons.Restore />
                      </button>
                      <button
                        onClick={() => setPurgeTarget({ id: item.id, title: item.name, type: 'category' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#ff5545] border border-[#44475a]"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6272a4] font-mono">
                    计划删除: {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeType === 'article' && (
        <div className="bg-[#21222c] border border-[#44475a] rounded-xl overflow-hidden shadow-xl mb-10">
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#44475a] bg-[#282a36]/50">
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">文章</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">作者</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">分类</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">删除原因</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em]">计划删除</th>
                  <th className="py-5 px-6 text-base lg:text-lg font-bold text-[#6272a4] uppercase tracking-[0.3em] text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#44475a]">
                {emptyState.article ? (
                  <tr>
                    <td colSpan={6} className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">
                      回收站暂无文章_
                    </td>
                  </tr>
                ) : (
                  deletedArticles.map(item => (
                    <tr key={item.id} className="hover:bg-[#ff5545]/5 transition-all duration-300 group">
                      <td className="py-5 px-6">
                        <p className="text-sm font-bold text-[#ff5545]/80 line-through decoration-1 tracking-tight">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#6272a4] font-mono mt-1.5 uppercase">
                          ID: {item.id.substring(0, 16)}...
                        </p>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-mono text-[#6272a4]">{getUserLabel(item.authorId)}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-[10px] text-[#6272a4] font-mono bg-[#282a36] px-2 py-1 rounded">
                          {getCategoryLabel(item.categoryId)}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="text-[10px] text-[#6272a4] font-mono">
                          {item.deleteReason ?? '—'}
                        </div>
                        {item.restoreRequestedAt && (
                          <div className="text-[9px] text-[#ffb86c] font-black uppercase mt-2">
                            恢复申请: {item.restoreRequestedMessage ?? '未填写说明'}
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-xs font-mono text-[#6272a4]">
                          {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => setRestoreTarget({ id: item.id, title: item.title, type: 'article' })}
                            className="p-2 text-[#6272a4] hover:text-[#50fa7b] hover:bg-[#50fa7b]/10 rounded-lg transition-all active:scale-90"
                            title="还原文章"
                          >
                            <Icons.Restore />
                          </button>
                          <button
                            onClick={() => setPurgeTarget({ id: item.id, title: item.title, type: 'article' })}
                            className="p-2 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-all active:scale-90"
                            title="彻底删除"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-[#44475a]">
            {emptyState.article ? (
              <div className="py-24 text-center text-[#6272a4] font-mono text-sm uppercase italic">回收站暂无文章_</div>
            ) : (
              deletedArticles.map(item => (
                <div key={item.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-[#ff5545]/80 line-through">{item.title}</h4>
                      <span className="text-[10px] text-[#6272a4] uppercase font-mono mt-1 block">
                        作者: {getUserLabel(item.authorId)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setRestoreTarget({ id: item.id, title: item.title, type: 'article' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#50fa7b] border border-[#44475a]"
                      >
                        <Icons.Restore />
                      </button>
                      <button
                        onClick={() => setPurgeTarget({ id: item.id, title: item.title, type: 'article' })}
                        className="p-3 bg-[#44475a]/30 rounded-lg text-[#ff5545] border border-[#44475a]"
                      >
                        <Icons.Trash />
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#6272a4] font-mono">
                    分类: {getCategoryLabel(item.categoryId)}
                  </div>
                  <div className="text-[10px] text-[#6272a4] font-mono">
                    删除原因: {item.deleteReason ?? '—'}
                  </div>
                  {item.restoreRequestedAt && (
                    <div className="text-[10px] text-[#ffb86c] font-mono">
                      恢复申请: {item.restoreRequestedMessage ?? '未填写说明'}
                    </div>
                  )}
                  <div className="text-[10px] text-[#6272a4] font-mono">
                    计划删除: {item.deleteScheduledAt ? new Date(item.deleteScheduledAt).toLocaleDateString() : '—'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!emptyState[activeType] && (
        <div className="flex items-center justify-center gap-3 animate-pulse px-4 text-center">
          <svg className="w-4 h-4 text-[#ff5545] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-[10px] md:text-xs text-[#ff5545] font-bold font-mono uppercase tracking-[0.2em]">
            警告：彻底删除不可逆，请谨慎操作_
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={!!restoreTarget}
        title="资源回收确认"
        message={`确认将资源 [${restoreTarget?.title}] 恢复到活动状态？`}
        confirmText="确认还原"
        onConfirm={() => {
          if (restoreTarget) onRestore(restoreTarget.id, restoreTarget.type);
          setRestoreTarget(null);
        }}
        onCancel={() => setRestoreTarget(null)}
      />

      <ConfirmModal
        isOpen={!!purgeTarget}
        title="彻底删除确认"
        message={`资源 [${purgeTarget?.title}] 将被彻底删除，无法恢复。确认继续？`}
        confirmText="确认删除"
        onConfirm={() => {
          if (purgeTarget) onPurge(purgeTarget.id, purgeTarget.type);
          setPurgeTarget(null);
        }}
        onCancel={() => setPurgeTarget(null)}
      />
    </div>
  );
};

export default RecycleBin;
