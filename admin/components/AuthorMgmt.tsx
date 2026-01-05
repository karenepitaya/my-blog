import React, { useEffect, useMemo, useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { Icons } from '../constants';
import PageHeader from './PageHeader';
import ConfirmModal from './ConfirmModal';

interface AuthorMgmtProps {
  users: User[];
  onCreate: (data: { username: string; password?: string }) => Promise<{ initialPassword: string | null } | null>;
  onReset: (id: string, input?: { reason?: string }) => Promise<{ initialPassword: string } | null>;
  onBan: (id: string, input?: { reason?: string }) => Promise<void>;
  onUnban: (id: string) => Promise<void>;
  onDelete: (id: string, input?: { graceDays?: number }) => Promise<void>;
  onUpdateAdminMeta: (id: string, input: { remark?: string | null; tags?: string[] }) => Promise<User | null>;
  onLoadDetail: (id: string) => Promise<User | null>;
}

type ActionKind = 'RESET' | 'BAN' | 'DELETE';

type ActionDialog = {
  type: ActionKind;
  user: User;
};

const DEFAULT_GRACE_DAYS = 30;

const AuthorMgmt: React.FC<AuthorMgmtProps> = ({
  users,
  onCreate,
  onReset,
  onBan,
  onUnban,
  onDelete,
  onUpdateAdminMeta,
  onLoadDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftUser, setDraftUser] = useState<{ username: string; password?: string }>({
    username: '',
    password: '',
  });
  const [actionDialog, setActionDialog] = useState<ActionDialog | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionGraceDays, setActionGraceDays] = useState(DEFAULT_GRACE_DAYS);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [adminTags, setAdminTags] = useState<string[]>([]);
  const [adminTagInput, setAdminTagInput] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return users.filter(u => {
      if (u.role !== UserRole.AUTHOR) return false;
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (!normalizedTerm) return true;
      return (
        u.username.toLowerCase().includes(normalizedTerm) ||
        u.id.toLowerCase().includes(normalizedTerm)
      );
    });
  }, [users, statusFilter, searchTerm]);

  useEffect(() => {
    if (!detailUser) return;
    setAdminRemark(detailUser.adminRemark ?? '');
    setAdminTags(Array.isArray(detailUser.adminTags) ? detailUser.adminTags : []);
    setAdminTagInput('');
  }, [detailUser]);

  const handleCreate = () => {
    setDraftUser({ username: '', password: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDraftUser({ username: '', password: '' });
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftUser.username.trim()) return;
    try {
      const result = await onCreate({
        username: draftUser.username.trim(),
        password: draftUser.password?.trim() || undefined,
      });
      closeModal();
      if (result?.initialPassword) {
        alert(`初始密码：${result.initialPassword}`);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleReset = async (user: User, reason?: string) => {
    try {
      const result = await onReset(user.id, { reason });
      if (result?.initialPassword) {
        alert(`重置密码：${result.initialPassword}`);
      }
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleAdminMetaSave = async () => {
    if (!detailUser) return;
    setIsSavingMeta(true);
    try {
      const updated = await onUpdateAdminMeta(detailUser.id, {
        remark: adminRemark.trim() ? adminRemark.trim() : null,
        tags: adminTags,
      });
      if (updated) {
        setDetailUser(updated);
      }
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const openDetail = async (user: User) => {
    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(user.id);
      setDetailUser(detail ?? user);
    } catch (err) {
      alert((err as Error).message);
      setDetailUser(user);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const statusClass = (status: UserStatus) => {
    if (status === UserStatus.ACTIVE) {
      return 'text-[#50fa7b] border-[#50fa7b]/20 bg-[#50fa7b]/5';
    }
    if (status === UserStatus.BANNED) {
      return 'text-[#ff5545] border-[#ff5545]/20 bg-[#ff5545]/5';
    }
    return 'text-[#f1fa8c] border-[#f1fa8c]/20 bg-[#f1fa8c]/5';
  };

  const statusLabel = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return '正常';
      case UserStatus.BANNED:
        return '已封禁';
      case UserStatus.PENDING_DELETE:
        return '待删除';
      default:
        return status;
    }
  };

  const addAdminTag = () => {
    const raw = adminTagInput.trim();
    if (!raw) return;
    const next = raw
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    setAdminTags(prev => Array.from(new Set([...prev, ...next])));
    setAdminTagInput('');
  };

  const removeAdminTag = (tag: string) => {
    setAdminTags(prev => prev.filter(t => t !== tag));
  };

  const openActionDialog = (type: ActionKind, user: User) => {
    setActionDialog({ type, user });
    setActionReason('');
    setActionGraceDays(DEFAULT_GRACE_DAYS);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="作者管理" motto="管理作者节点、权限状态与运营标签。" />

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="搜索用户名或 ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#21222c] border border-[#44475a] px-6 py-4 rounded-xl text-sm text-[#f8f8f2] focus:border-[#bd93f9] focus:outline-none transition-all placeholder-[#44475a] shadow-inner font-mono"
        />
        <div className="flex flex-wrap gap-2">
          {[
            { label: '全部', value: 'ALL' },
            { label: '正常', value: UserStatus.ACTIVE },
            { label: '封禁', value: UserStatus.BANNED },
            { label: '待删除', value: UserStatus.PENDING_DELETE },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value as any)}
              className={`px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold uppercase tracking-widest transition-all active:scale-95 ${
                statusFilter === item.value
                  ? 'bg-[#bd93f9] text-[#282a36]'
                  : 'bg-[#282a36] text-[#6272a4] hover:text-[#f8f8f2]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleCreate}
        className="flex items-center gap-2 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] px-8 py-4 rounded-xl font-black text-sm lg:text-base uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-500/20 whitespace-nowrap"
        >
          <Icons.Plus />
          新建作者
        </button>
      </div>

      <div className="bg-[#21222c] border border-[#44475a] rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#282a36]/50 border-b border-[#44475a]">
            <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">作者</th>
            <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">状态</th>
            <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">运营标签</th>
            <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em]">最近登录</th>
            <th className="py-5 px-6 text-base lg:text-lg font-black text-[#6272a4] uppercase tracking-[0.3em] text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#44475a]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-24 text-center text-[#6272a4] font-mono text-xs uppercase italic">
                  暂无匹配作者。
                </td>
              </tr>
            ) : (
              filteredUsers.map(u => (
                <tr key={u.id} className="group hover:bg-[#44475a]/10 transition-colors">
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#282a36] border border-[#44475a] flex items-center justify-center text-[#bd93f9] font-black group-hover:border-[#bd93f9] transition-colors">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.username} className="w-full h-full rounded-lg object-cover" />
                        ) : (
                          u.username[0]
                        )}
                      </div>
                      <div>
                        <p className="text-base lg:text-lg font-semibold text-[#f8f8f2]">{u.username}</p>
                        <p className="text-xs lg:text-sm text-[#6272a4] font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {u.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span
                    className={`text-xs lg:text-sm px-2 py-0.5 rounded border font-semibold uppercase tracking-widest ${statusClass(
                      u.status
                    )}`}
                    >
                      {statusLabel(u.status)}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-wrap gap-2">
                      {(u.adminTags ?? []).length === 0 ? (
                        <span className="text-xs text-[#6272a4]">—</span>
                      ) : (
                        (u.adminTags ?? []).slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded border font-semibold uppercase tracking-widest text-[#bd93f9] border-[#bd93f9]/30 bg-[#bd93f9]/10"
                          >
                            {tag}
                          </span>
                        ))
                      )}
                      {(u.adminTags ?? []).length > 3 && (
                        <span className="text-xs text-[#6272a4]">+{(u.adminTags ?? []).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-sm font-mono text-[#6272a4]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className="flex justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openDetail(u)}
                        className="px-3 py-1 bg-[#282a36] border border-[#8be9fd]/30 text-[#8be9fd] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#8be9fd]/10 transition-transform active:scale-95"
                        title="查看详情"
                      >
                        {isLoadingDetail ? '加载中' : '详情'}
                      </button>
                      <button
                        onClick={() => openActionDialog('RESET', u)}
                        className="px-3 py-1 bg-[#282a36] border border-[#f1fa8c]/30 text-[#f1fa8c] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#f1fa8c]/10 transition-transform active:scale-95"
                        title="重置密码"
                      >
                        重置
                      </button>
                      {u.status === UserStatus.ACTIVE ? (
                        <button
                          onClick={() => openActionDialog('BAN', u)}
                          className="px-3 py-1 bg-[#282a36] border border-[#ffb86c]/30 text-[#ffb86c] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#ffb86c]/10 transition-transform active:scale-95"
                          title="封禁"
                        >
                          封禁
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await onUnban(u.id);
                            } catch (err) {
                              alert((err as Error).message);
                            }
                          }}
                          className="px-3 py-1 bg-[#282a36] border border-[#50fa7b]/30 text-[#50fa7b] text-xs lg:text-sm font-semibold rounded uppercase hover:bg-[#50fa7b]/10 transition-transform active:scale-95"
                          title="解封"
                        >
                          解封
                        </button>
                      )}
                      <button
                        onClick={() => openActionDialog('DELETE', u)}
                        className="p-1.5 text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-lg transition-transform active:scale-95"
                        title="加入回收站"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-[#bd93f9] italic uppercase mb-8 border-b border-[#44475a] pb-4">
              新建作者
            </h3>
            <form onSubmit={submitForm} className="space-y-6">
              <div className="space-y-4">
                <input
                  required
                  placeholder="用户名"
                  className="w-full bg-[#282a36] border border-[#44475a] p-4 text-base text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none"
                  value={draftUser.username}
                  onChange={e => setDraftUser({ ...draftUser, username: e.target.value })}
                />
                <input
                  type="password"
                  placeholder="初始密码（可选）"
                  className="w-full bg-[#282a36] border border-[#44475a] p-4 text-base text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none"
                  value={draftUser.password}
                  onChange={e => setDraftUser({ ...draftUser, password: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-4 text-sm font-semibold text-[#6272a4] uppercase tracking-widest"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-sm rounded-xl shadow-lg transition-all uppercase tracking-widest"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailUser && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#44475a]">
              <div>
                <h3 className="text-lg font-black text-[#f8f8f2]">作者详情</h3>
                <p className="text-xs text-[#6272a4] font-mono uppercase mt-1">{detailUser.id}</p>
              </div>
              <div className="flex items-center gap-3">
                {isLoadingDetail && (
                  <span className="text-xs text-[#6272a4] font-mono uppercase">同步中...</span>
                )}
                <button
                  onClick={() => setDetailUser(null)}
                  className="text-[#6272a4] hover:text-[#f8f8f2] text-xs font-black"
                >
                  关闭
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#282a36] border border-[#44475a] flex items-center justify-center text-[#bd93f9] font-black">
                    {detailUser.avatarUrl ? (
                      <img src={detailUser.avatarUrl} alt={detailUser.username} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      detailUser.username[0]
                    )}
                  </div>
                  <div>
                    <p className="text-base font-black text-[#f8f8f2]">{detailUser.username}</p>
                    <p className="text-xs text-[#6272a4] font-mono uppercase mt-1">
                      {statusLabel(detailUser.status)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px] text-[#6272a4]">
                  <div className="bg-[#282a36] border border-[#44475a] rounded-lg p-3">
                    <p className="uppercase font-semibold text-xs">最近登录</p>
                    <p className="mt-1 text-[#f8f8f2]">
                      {detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString() : '—'}
                    </p>
                  </div>
                  <div className="bg-[#282a36] border border-[#44475a] rounded-lg p-3">
                    <p className="uppercase font-semibold text-xs">注册时间</p>
                    <p className="mt-1 text-[#f8f8f2]">
                      {new Date(detailUser.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#282a36] border border-[#44475a] rounded-lg p-3">
                    <p className="uppercase font-semibold text-xs">封禁原因</p>
                    <p className="mt-1 text-[#f8f8f2]">
                      {detailUser.bannedReason ?? '—'}
                    </p>
                  </div>
                  <div className="bg-[#282a36] border border-[#44475a] rounded-lg p-3">
                    <p className="uppercase font-semibold text-xs">回收计划</p>
                    <p className="mt-1 text-[#f8f8f2]">
                      {detailUser.deleteScheduledAt
                        ? new Date(detailUser.deleteScheduledAt).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                </div>
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
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-3 ml-1 tracking-widest">
                    运营标签
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {adminTags.length === 0 ? (
                      <span className="text-xs text-[#6272a4]">—</span>
                    ) : (
                      adminTags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#44475a]/40 border border-[#bd93f9]/30 text-[#bd93f9] text-xs font-semibold rounded-lg uppercase"
                        >
                          {tag}
                          <button
                            onClick={() => removeAdminTag(tag)}
                            className="hover:text-[#ff5545] font-mono transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminTagInput}
                      onChange={e => setAdminTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAdminTag();
                        }
                      }}
                      placeholder="输入标签，回车或逗号分隔"
                      className="flex-1 bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none"
                    />
                    <button
                      onClick={addAdminTag}
                      className="px-4 py-3 bg-[#44475a] text-[#f8f8f2] text-xs font-semibold rounded-xl uppercase"
                    >
                      添加
                    </button>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setDetailUser(null)}
                    className="px-4 py-2 text-xs font-black text-[#6272a4] uppercase"
                  >
                    关闭
                  </button>
                  <button
                    onClick={handleAdminMetaSave}
                    disabled={isSavingMeta}
                    className="px-6 py-3 bg-[#bd93f9] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl shadow-lg uppercase tracking-widest disabled:opacity-60"
                  >
                    {isSavingMeta ? '保存中...' : '保存备注'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!actionDialog && actionDialog.type === 'RESET'}
        title="确认重置"
        message="重置后将生成新的初始密码。确认继续？"
        confirmText="确认重置"
        onConfirm={() => {
          if (!actionDialog) return;
          handleReset(actionDialog.user, actionReason.trim() || undefined);
          setActionDialog(null);
        }}
        onCancel={() => setActionDialog(null)}
      />

      {actionDialog && (actionDialog.type === 'BAN' || actionDialog.type === 'DELETE') && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#282a36]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#21222c] border border-[#44475a] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-5 border-b border-[#44475a]">
              <h4 className="text-sm font-black text-[#f8f8f2] uppercase tracking-widest">
                {actionDialog.type === 'BAN' ? '封禁作者' : '加入回收站'}
              </h4>
              <p className="text-xs text-[#6272a4] mt-2 font-mono">
                {actionDialog.user.username} · {actionDialog.user.id}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {actionDialog.type === 'BAN' && (
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                    封禁原因（可选）
                  </label>
                  <textarea
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    className="w-full h-20 bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2]/80 rounded-xl focus:border-[#bd93f9] outline-none resize-none"
                    placeholder="记录封禁原因"
                  />
                </div>
              )}
              {actionDialog.type === 'DELETE' && (
                <div>
                  <label className="block text-sm text-[#6272a4] font-black uppercase mb-2 ml-1 tracking-widest">
                    回收站保留天数
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={actionGraceDays}
                    onChange={e => setActionGraceDays(Math.max(1, Math.min(365, Number(e.target.value))))}
                    className="w-full bg-[#282a36] border-2 border-[#44475a] p-3 text-sm text-[#f8f8f2] rounded-xl focus:border-[#bd93f9] outline-none font-mono"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-6 pt-2 border-t border-[#44475a]">
              <button
                onClick={() => setActionDialog(null)}
                className="flex-1 py-3 text-xs font-semibold text-[#6272a4] uppercase tracking-widest"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!actionDialog) return;
                  try {
                    if (actionDialog.type === 'BAN') {
                      await onBan(actionDialog.user.id, { reason: actionReason.trim() || undefined });
                    } else {
                      await onDelete(actionDialog.user.id, { graceDays: actionGraceDays });
                    }
                  } catch (err) {
                    alert((err as Error).message);
                  } finally {
                    setActionDialog(null);
                  }
                }}
                className="flex-1 py-3 bg-[#ff5545] hover:bg-[#ff79c6] text-[#282a36] font-black text-xs rounded-xl transition-all shadow-lg uppercase tracking-widest active:scale-95"
              >
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorMgmt;
