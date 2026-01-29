import React, { useEffect, useMemo, useState } from 'react';
import { Ban, Info, KeyRound, Plus, RotateCcw, Search, ShieldCheck, Skull, Trash2 } from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';
import PageHeader from './PageHeader';
import { ConfirmModal } from './NeoShared/ui/ConfirmModal';
import { CyberInput } from './NeoShared/ui/CyberInput';
import { GlassCard } from './NeoShared/ui/GlassCard';
import { NeonButton } from './NeoShared/ui/NeonButton';
import { useNeoToast } from './NeoShared/ui/Toast';

interface AuthorMgmtProps {
  users: User[];
  onCreate: (data: { username: string; password?: string }) => Promise<{ initialPassword: string | null } | null>;
  onReset: (id: string, input?: { reason?: string }) => Promise<{ initialPassword: string } | null>;
  onBan: (id: string, input?: { reason?: string }) => Promise<void>;
  onUnban: (id: string) => Promise<void>;
  onDelete: (id: string, input?: { graceDays?: number }) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
  onPurge: (id: string) => Promise<void>;
  onUpdateAdminMeta: (id: string, input: { remark?: string | null; tags?: string[] }) => Promise<User | null>;
  onLoadDetail: (id: string) => Promise<User | null>;
}

type ActionKind = 'RESET' | 'BAN' | 'DELETE';
type ActionDialog = { type: ActionKind; user: User };

const DEFAULT_GRACE_DAYS = 30;
const toErrMsg = (err: unknown) => (err instanceof Error ? err.message : String(err));
const iconBtnBase =
  'p-2 rounded-lg border border-transparent transition-all disabled:opacity-40 disabled:cursor-not-allowed';

const statusLabel = (status: UserStatus) => {
  switch (status) {
    case UserStatus.ACTIVE:
      return '正常';
    case UserStatus.BANNED:
      return '已封禁';
    case UserStatus.PENDING_DELETE:
      return '回收站';
    default:
      return status;
  }
};

const AuthorMgmt: React.FC<AuthorMgmtProps> = ({
  users,
  onCreate,
  onReset,
  onBan,
  onUnban,
  onDelete,
  onRestore,
  onPurge,
  onUpdateAdminMeta,
  onLoadDetail,
}) => {
  const toast = useNeoToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [draftUser, setDraftUser] = useState<{ username: string; password?: string }>({ username: '', password: '' });
  const [passwordReveal, setPasswordReveal] = useState<{ title: string; password: string } | null>(null);

  const [actionDialog, setActionDialog] = useState<ActionDialog | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionGraceDays, setActionGraceDays] = useState(DEFAULT_GRACE_DAYS);

  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const [adminRemark, setAdminRemark] = useState('');
  const [adminTags, setAdminTags] = useState<string[]>([]);
  const [adminTagInput, setAdminTagInput] = useState('');
  const [isSavingMeta, setIsSavingMeta] = useState(false);

  const [restoreTarget, setRestoreTarget] = useState<User | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<User | null>(null);

  const allAuthors = useMemo(() => users.filter((u) => u.role === UserRole.AUTHOR), [users]);

  const filteredUsers = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    return allAuthors.filter((u) => {
      if (statusFilter !== 'ALL' && u.status !== statusFilter) return false;
      if (!normalizedTerm) return true;
      return u.username.toLowerCase().includes(normalizedTerm) || u.id.toLowerCase().includes(normalizedTerm);
    });
  }, [allAuthors, statusFilter, searchTerm]);

  useEffect(() => {
    if (!detailUser) return;
    setAdminRemark(detailUser.adminRemark ?? '');
    setAdminTags(Array.isArray(detailUser.adminTags) ? detailUser.adminTags : []);
    setAdminTagInput('');
  }, [detailUser]);

  const closeCreate = () => {
    setCreateOpen(false);
    setDraftUser({ username: '', password: '' });
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftUser.username.trim()) return;
    try {
      const result = await onCreate({
        username: draftUser.username.trim(),
        password: draftUser.password?.trim() || undefined,
      });
      closeCreate();
      toast.success('作者已创建');
      if (result?.initialPassword) setPasswordReveal({ title: '初始密码', password: result.initialPassword });
    } catch (err) {
      toast.error(toErrMsg(err));
    }
  };

  const handleReset = async (user: User, reason?: string) => {
    try {
      const result = await onReset(user.id, { reason });
      toast.success('密码已重置');
      if (result?.initialPassword) setPasswordReveal({ title: '重置密码', password: result.initialPassword });
    } catch (err) {
      toast.error(toErrMsg(err));
    }
  };

  const openDetail = async (user: User) => {
    setIsLoadingDetail(true);
    try {
      const detail = await onLoadDetail(user.id);
      setDetailUser(detail ?? user);
    } catch (err) {
      toast.error(toErrMsg(err));
      setDetailUser(user);
    } finally {
      setIsLoadingDetail(false);
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
      if (updated) setDetailUser(updated);
      toast.success('已保存作者备注');
    } catch (err) {
      toast.error(toErrMsg(err));
    } finally {
      setIsSavingMeta(false);
    }
  };

  const addAdminTag = () => {
    const raw = adminTagInput.trim();
    if (!raw) return;
    const next = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (next.length === 0) return;
    setAdminTags((prev) => Array.from(new Set([...prev, ...next])));
    setAdminTagInput('');
  };

  const removeAdminTag = (tag: string) => setAdminTags((prev) => prev.filter((t) => t !== tag));

  const openActionDialog = (type: ActionKind, user: User) => {
    setActionDialog({ type, user });
    setActionReason('');
    setActionGraceDays(DEFAULT_GRACE_DAYS);
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success('已复制到剪贴板');
    } catch {
      toast.warning(`复制失败，请手动复制：${value}`);
    }
  };

  const filterButtons = [
    { id: 'ALL' as const, label: '全部' },
    { id: UserStatus.ACTIVE as const, label: '正常' },
    { id: UserStatus.BANNED as const, label: '封禁' },
    { id: UserStatus.PENDING_DELETE as const, label: '回收站' },
  ];

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      <PageHeader title="作者管理" motto="管理作者节点、权限状态与运营标签。" />
      <GlassCard className="p-4 sticky top-2 z-30 bg-surface/60">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="relative w-full lg:w-[360px] group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors"
              size={16}
            />
            <input
              type="text"
              placeholder="搜索 username / id"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors placeholder:text-muted font-mono"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <div className="flex bg-surface p-1 rounded-lg border border-border shadow-sm gap-1">
              {filterButtons.map((f) => {
                const active = statusFilter === f.id;
                const isTrash = f.id === UserStatus.PENDING_DELETE;
                const cls = [
                  'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap',
                  active
                    ? isTrash
                      ? 'bg-red-500/20 text-red-300 shadow-sm ring-1 ring-red-500/30'
                      : 'bg-fg/8 text-fg shadow-sm ring-1 ring-border'
                    : isTrash
                      ? 'text-muted hover:text-danger hover:bg-fg/5'
                      : 'text-muted hover:text-fg hover:bg-fg/5',
                ].join(' ');
                return (
                  <button key={f.id} onClick={() => setStatusFilter(f.id as any)} className={cls}>
                    {f.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 text-xs font-mono text-muted whitespace-nowrap">
              <span>结果</span>
              <span className="text-fg font-semibold">{filteredUsers.length}</span>
              <span className="text-muted">/</span>
              <span>{allAuthors.length}</span>
            </div>

            <NeonButton variant="secondary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              新建作者
            </NeonButton>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface2/60 border-b border-border">
              <tr>
                <th className="text-left py-4 pl-8 pr-4 text-xs font-semibold tracking-wide text-muted">
                  作者
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-muted">
                  状态
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-muted">
                  运营标签
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold tracking-wide text-muted">
                  最近登录
                </th>
                <th className="text-right py-4 pr-8 pl-4 text-xs font-semibold tracking-wide text-muted">
                  操作
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted">
                    暂无匹配作者
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-fg/3 transition-colors duration-200">
                    <td className="py-5 pl-8 pr-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface2/60 border border-border flex items-center justify-center text-primary font-semibold overflow-hidden">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            u.username[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-base font-semibold text-fg truncate">{u.username}</div>
                          <div className="text-xs text-muted font-mono truncate">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-5 px-4">
                      <span
                        className={[
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border backdrop-blur-sm',
                          u.status === UserStatus.ACTIVE
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : u.status === UserStatus.BANNED
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                              : 'bg-red-500/10 text-red-300 border-red-500/20',
                        ].join(' ')}
                      >
                        {statusLabel(u.status)}
                      </span>
                    </td>

                    <td className="py-5 px-4">
                      <div className="flex flex-wrap gap-2">
                        {(u.adminTags ?? []).length === 0 ? (
                          <span className="text-xs text-muted font-mono">—</span>
                        ) : (
                          (u.adminTags ?? []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded border font-semibold tracking-wide text-primary border-primary/30 bg-primary/10"
                            >
                              {tag}
                            </span>
                          ))
                        )}
                        {(u.adminTags ?? []).length > 3 ? (
                          <span className="text-xs text-muted font-mono">+{(u.adminTags ?? []).length - 3}</span>
                        ) : null}
                      </div>
                    </td>

                    <td className="py-5 px-4">
                      <span className="text-sm font-mono text-muted">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                      </span>
                    </td>

                    <td className="py-5 pr-8 pl-4">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openDetail(u)}
                          className={[
                            iconBtnBase,
                            'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 hover:border-cyan-500/30',
                          ].join(' ')}
                          title="详情"
                          disabled={isLoadingDetail}
                        >
                          <Info size={16} />
                        </button>

                        <button
                          onClick={() => openActionDialog('RESET', u)}
                          className={[
                            iconBtnBase,
                            'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 hover:border-amber-500/30',
                          ].join(' ')}
                          title="重置密码"
                        >
                          <KeyRound size={16} />
                        </button>

                        {u.status === UserStatus.ACTIVE ? (
                          <button
                            onClick={() => openActionDialog('BAN', u)}
                            className={[
                              iconBtnBase,
                              'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 hover:border-amber-500/30',
                            ].join(' ')}
                            title="封禁"
                          >
                            <Ban size={16} />
                          </button>
                        ) : u.status === UserStatus.BANNED ? (
                          <button
                            onClick={async () => {
                              try {
                                await onUnban(u.id);
                                toast.success('已解封作者');
                              } catch (err) {
                                toast.error(toErrMsg(err));
                              }
                            }}
                            className={[
                              iconBtnBase,
                              'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/30',
                            ].join(' ')}
                            title="解封"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setRestoreTarget(u)}
                              className={[
                                iconBtnBase,
                                'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 hover:border-emerald-500/30',
                              ].join(' ')}
                              title="恢复作者"
                            >
                              <RotateCcw size={16} />
                            </button>
                            <button
                              onClick={() => setPurgeTarget(u)}
                              className={[
                                iconBtnBase,
                                'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/30',
                              ].join(' ')}
                              title="彻底删除"
                            >
                              <Skull size={16} />
                            </button>
                          </>
                        )}

                        {u.status !== UserStatus.PENDING_DELETE ? (
                          <button
                            onClick={() => openActionDialog('DELETE', u)}
                            className={[
                              iconBtnBase,
                              'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/30',
                            ].join(' ')}
                            title="加入回收站"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {createOpen ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={closeCreate} />
          <GlassCard className="w-full max-w-lg relative" noPadding>
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface2/60">
              <div>
                <div className="text-lg font-semibold text-fg">新建作者</div>
                <div className="text-xs text-muted mt-1 font-mono">创建后会返回初始密码（仅展示一次）</div>
              </div>
              <NeonButton variant="ghost" onClick={closeCreate}>
                关闭
              </NeonButton>
            </div>

            <form onSubmit={submitCreate} className="p-6 space-y-5">
              <CyberInput
                label="用户名"
                value={draftUser.username}
                onChange={(e) => setDraftUser({ ...draftUser, username: e.target.value })}
                placeholder="例如 karene"
                autoFocus
              />
              <CyberInput
                label="初始密码（可选）"
                value={draftUser.password ?? ''}
                onChange={(e) => setDraftUser({ ...draftUser, password: e.target.value })}
                placeholder="留空则自动生成"
              />

              <div className="flex justify-end gap-3 pt-2">
                <NeonButton variant="ghost" type="button" onClick={closeCreate}>
                  取消
                </NeonButton>
                <NeonButton variant="secondary" type="submit" icon={<Plus size={16} />}>
                  创建
                </NeonButton>
              </div>
            </form>
          </GlassCard>
        </div>
      ) : null}

      {detailUser ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setDetailUser(null)} />
          <GlassCard className="w-full max-w-4xl relative overflow-hidden" noPadding>
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-surface2/60">
              <div>
                <div className="text-lg font-semibold text-fg">作者详情</div>
                <div className="text-xs text-muted font-mono mt-1">{detailUser.id}</div>
              </div>
              <div className="flex items-center gap-3">
                {isLoadingDetail ? <div className="text-xs text-muted font-mono">同步中...</div> : null}
                <NeonButton variant="ghost" onClick={() => setDetailUser(null)}>
                  关闭
                </NeonButton>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-surface2/60 border border-border flex items-center justify-center text-primary font-semibold overflow-hidden">
                    {detailUser.avatarUrl ? (
                      <img src={detailUser.avatarUrl} alt={detailUser.username} className="w-full h-full object-cover" />
                    ) : (
                      detailUser.username[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-fg truncate">{detailUser.username}</div>
                    <div className="text-xs text-muted font-mono mt-1">{statusLabel(detailUser.status)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] text-muted">
                  <div className="bg-fg/3 border border-border rounded-lg p-3">
                    <div className="font-semibold text-xs">最近登录</div>
                    <div className="mt-1 text-fg">
                      {detailUser.lastLoginAt ? new Date(detailUser.lastLoginAt).toLocaleString() : '—'}
                    </div>
                  </div>
                  <div className="bg-fg/3 border border-border rounded-lg p-3">
                    <div className="font-semibold text-xs">注册时间</div>
                    <div className="mt-1 text-fg">{new Date(detailUser.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="bg-fg/3 border border-border rounded-lg p-3 col-span-2">
                    <div className="font-semibold text-xs">封禁原因</div>
                    <div className="mt-1 text-fg">{detailUser.bannedReason ?? '—'}</div>
                  </div>
                  <div className="bg-fg/3 border border-border rounded-lg p-3 col-span-2">
                    <div className="font-semibold text-xs">回收计划</div>
                    <div className="mt-1 text-fg">
                      {detailUser.deleteScheduledAt ? new Date(detailUser.deleteScheduledAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-muted font-semibold mb-2 ml-1">管理备注</label>
                  <textarea
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    placeholder="填写内部备注..."
                    className="w-full h-24 bg-surface border border-border p-4 text-sm text-fg rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted font-semibold mb-2 ml-1">运营标签</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {adminTags.length === 0 ? (
                      <span className="text-xs text-muted font-mono">—</span>
                    ) : (
                      adminTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-2 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold rounded-lg"
                        >
                          {tag}
                          <button
                            onClick={() => removeAdminTag(tag)}
                            className="hover:text-rose-300 font-mono transition-colors"
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
                      onChange={(e) => setAdminTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAdminTag();
                        }
                      }}
                      placeholder="输入标签，回车或逗号分隔"
                      className="flex-1 bg-surface border border-border p-3 text-sm text-fg rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono placeholder:text-muted"
                    />
                    <NeonButton variant="ghost" type="button" onClick={addAdminTag}>
                      添加
                    </NeonButton>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <NeonButton variant="ghost" onClick={() => setDetailUser(null)}>
                    关闭
                  </NeonButton>
                  <NeonButton variant="primary" onClick={handleAdminMetaSave} disabled={isSavingMeta}>
                    {isSavingMeta ? '保存中...' : '保存备注'}
                  </NeonButton>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={!!passwordReveal}
        onClose={() => setPasswordReveal(null)}
        onConfirm={() => {
          if (!passwordReveal) return;
          void copyToClipboard(passwordReveal.password);
          setPasswordReveal(null);
        }}
        title={passwordReveal ? passwordReveal.title : ''}
        message={
          passwordReveal ? (
            <div className="space-y-3">
              <div className="text-muted text-xs">请妥善保存，出于安全原因不会再次展示。</div>
              <div className="bg-surface/60 border border-border rounded-lg px-3 py-2 font-mono text-fg select-all">
                {passwordReveal.password}
              </div>
            </div>
          ) : (
            ''
          )
        }
        type="info"
        confirmText="复制并关闭"
        cancelText="关闭"
      />

      <ConfirmModal
        isOpen={!!actionDialog && actionDialog.type === 'RESET'}
        onClose={() => setActionDialog(null)}
        onConfirm={() => {
          if (!actionDialog) return;
          void handleReset(actionDialog.user, actionReason.trim() || undefined);
          setActionDialog(null);
        }}
        title="确认重置密码"
        message="重置后将生成新的初始密码（仅展示一次）。确认继续？"
        type="warning"
        confirmText="确认重置"
      />

      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={async () => {
          if (!restoreTarget) return;
          const target = restoreTarget;
          setRestoreTarget(null);
          try {
            await onRestore(target.id);
            toast.success('已恢复作者');
          } catch (err) {
            toast.error(toErrMsg(err));
          }
        }}
        title="恢复作者"
        message={restoreTarget ? `确认恢复作者 @${restoreTarget.username}？` : ''}
        type="success"
        confirmText="确认恢复"
      />

      <ConfirmModal
        isOpen={!!purgeTarget}
        onClose={() => setPurgeTarget(null)}
        onConfirm={async () => {
          if (!purgeTarget) return;
          const target = purgeTarget;
          setPurgeTarget(null);
          try {
            await onPurge(target.id);
            toast.success('已彻底删除作者');
          } catch (err) {
            toast.error(toErrMsg(err));
          }
        }}
        title="彻底删除作者"
        message={purgeTarget ? `警告：该操作不可撤销。确认彻底删除作者 @${purgeTarget.username}？` : ''}
        type="danger"
        confirmText="确认删除"
      />

      {actionDialog && (actionDialog.type === 'BAN' || actionDialog.type === 'DELETE') ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="absolute inset-0" onClick={() => setActionDialog(null)} />
          <GlassCard className="w-full max-w-md relative overflow-hidden" noPadding>
            <div className="px-6 py-5 border-b border-border bg-surface2/60">
              <div className="text-sm font-semibold text-fg tracking-wide">
                {actionDialog.type === 'BAN' ? '封禁作者' : '加入回收站'}
              </div>
              <div className="text-xs text-muted mt-2 font-mono">
                @{actionDialog.user.username} · {actionDialog.user.id}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {actionDialog.type === 'BAN' ? (
                <div>
                  <label className="block text-sm text-muted font-semibold mb-2 ml-1">封禁原因（可选）</label>
                  <textarea
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full h-20 bg-surface border border-border p-3 text-sm text-fg rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:text-muted"
                    placeholder="记录封禁原因"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-muted font-semibold mb-2 ml-1">回收站保留天数</label>
                  <p className="text-sm text-muted leading-relaxed">
                    使用「系统设置 → 回收站缓存」的全局期限
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 pt-2 border-t border-border">
              <NeonButton variant="ghost" onClick={() => setActionDialog(null)}>
                取消
              </NeonButton>
              <NeonButton
                variant={actionDialog.type === 'BAN' ? 'warning' : 'danger'}
                onClick={async () => {
                  if (!actionDialog) return;
                  try {
                    if (actionDialog.type === 'BAN') {
                      await onBan(actionDialog.user.id, { reason: actionReason.trim() || undefined });
                      toast.warning('已封禁作者');
                    } else {
                      await onDelete(actionDialog.user.id);
                      toast.warning('已移入回收站');
                    }
                  } catch (err) {
                    toast.error(toErrMsg(err));
                  } finally {
                    setActionDialog(null);
                  }
                }}
              >
                确认执行
              </NeonButton>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
};

export default AuthorMgmt;
