import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { UserRole, User, UserStatus } from '../types';
import { Icons } from '../constants';
import ConfirmModal from './ConfirmModal';
import { IconLabel } from './IconLabel';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  users: User[];
  children: React.ReactNode;
  impersonation?: { adminToken: string; adminUser: User } | null;
  onExitImpersonation?: () => void;
  onImpersonateAuthor?: (authorId: string, reason?: string) => Promise<void> | void;
}

const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  users,
  children,
  impersonation = null,
  onExitImpersonation,
  onImpersonateAuthor,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true);
  const [isImpersonatePickerOpen, setIsImpersonatePickerOpen] = useState(false);
  const isAdmin = user.role === UserRole.ADMIN;
  const canImpersonate = import.meta.env.MODE !== 'production';
  const navigate = useNavigate();
  const location = useLocation();
  const isArticlesActive =
    location.pathname.startsWith('/articles') || location.pathname.startsWith('/admin/articles');

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const NavItem: React.FC<{ to: string; icon: React.ComponentType<any>; children: React.ReactNode }> = ({ to, icon: Icon, children }) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => `
        flex items-center rounded-xl transition-colors duration-200 mx-3 group relative border
        ${isActive
          ? 'bg-fg/8 text-fg border-primary/25'
          : 'border-transparent text-muted hover:text-fg hover:bg-fg/5'}
        ${collapsed ? 'justify-center h-10 w-10 mx-auto mb-2' : 'px-4 py-3 mb-1.5 gap-3.5'}
      `}
    >
      <IconLabel icon={<Icon />} label={collapsed ? null : children} labelSize="lg" hoverScale={!collapsed} />
      {!collapsed && (
        <div className={`absolute right-3 w-1.5 h-1.5 rounded-full bg-primary transition-opacity duration-200 ${window.location.hash.endsWith(to) || (to !== '/' && window.location.hash.includes(to)) ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </NavLink>
  );

  const SubItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    const isActive = location.pathname + location.search === to;

    return (
      <NavLink
        to={to}
        className={`
          flex items-center py-2 px-5 ml-6 mr-3 rounded-lg text-sm lg:text-base font-medium transition-colors mb-1 group border border-transparent
          ${isActive 
            ? 'text-fg bg-primary/10 border-primary/20' 
            : 'text-muted hover:text-fg hover:bg-fg/5'}
        `}
      >
        <span className="truncate">{label}</span>
      </NavLink>
    );
  };

  return (
    <div className="admin-theme flex h-screen bg-canvas overflow-hidden text-fg">
      <aside
        className={`border-r border-border bg-surface flex flex-col shrink-0 transition-all duration-300 ease-in-out z-50 ${collapsed ? 'w-16' : 'w-64 lg:w-72'}`}
      >
        <div className={`flex flex-col border-b border-fg/10 ${collapsed ? 'py-5 items-center' : 'p-6 lg:p-7'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'mb-4' : 'mb-0 justify-between w-full'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-primary shrink-0" />
              {!collapsed && (
                <h1 className="text-lg lg:text-xl font-semibold tracking-tight truncate text-fg">
                  MultiTerm
                </h1>
              )}
            </div>
            {!collapsed && !isMobile && (
              <button onClick={() => setCollapsed(true)} className="text-muted hover:text-fg transition-colors p-1 rounded-lg hover:bg-fg/5">
                <span className="font-mono text-xs opacity-70">[×]</span>
              </button>
            )}
          </div>
          {collapsed && !isMobile && (
            <button onClick={() => setCollapsed(false)} className="text-muted hover:text-fg transition-colors mt-1 rounded-lg hover:bg-fg/5 px-2 py-1">
              <span className="font-mono text-xs opacity-70">[+]</span>
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 lg:py-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <NavItem to="/" icon={Icons.Dashboard}>控制台总览</NavItem>

          {impersonation && user.role === UserRole.AUTHOR && (
            <div className={collapsed ? 'mx-2 mb-3' : 'mx-3 mb-4'}>
              <div className={collapsed ? 'rounded-xl border border-primary/20 bg-primary/5 p-2 flex justify-center' : 'rounded-xl border border-primary/20 bg-primary/5 px-4 py-3'}>
                {collapsed ? (
                  <button
                    onClick={() => onExitImpersonation?.()}
                    className="w-10 h-10 rounded-xl grid place-items-center text-primary border border-primary/20 bg-fg/5 hover:bg-fg/8 transition-colors font-semibold"
                    title="返回管理员视角"
                  >
                    返
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold tracking-wide text-primary">代入作者视角</div>
                      <div className="text-[11px] text-muted truncate mt-1">管理员：@{impersonation.adminUser.username}</div>
                    </div>
                    <button
                      onClick={() => onExitImpersonation?.()}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide bg-fg/5 hover:bg-fg/8 text-fg border border-fg/10 transition-colors"
                    >
                      返回
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isAdmin ? (
            <div>
              <div
                onClick={() => {
                  if (collapsed) {
                    navigate('/admin/articles');
                  } else {
                    setIsArticlesExpanded(!isArticlesExpanded);
                    if (!isArticlesActive) navigate('/admin/articles');
                  }
                }}
                className={`flex items-center rounded-xl transition-colors duration-200 mx-3 cursor-pointer group relative mb-1.5 px-4 py-3 gap-3.5 border border-transparent
                  ${isArticlesActive
                    ? 'bg-fg/8 text-fg border-primary/25'
                    : 'text-muted hover:text-fg hover:bg-fg/5'}
                  ${collapsed ? 'justify-center h-10 w-10 mx-auto' : ''}
                `}
              >
                <IconLabel icon={<Icons.Articles />} label={collapsed ? null : '文章管理'} labelSize="responsive" hoverScale />
                {!collapsed && (
                  <span className={`text-[10px] leading-none shrink-0 self-center transition-transform duration-200 ${isArticlesExpanded ? 'rotate-90' : ''}`}>›</span>
                )}
              </div>

              {!collapsed && isArticlesExpanded && (
                <div className="mb-3 animate-in slide-in-from-top-1 duration-200 border-l border-fg/10 ml-8 pl-2">
                  {users
                    .filter(u => u.role === UserRole.AUTHOR && u.status !== UserStatus.PENDING_DELETE)
                    .map(u => (
                      <SubItem key={u.id} to={`/admin/articles?authorId=${u.id}`} label={`@${u.username}`} />
                    ))}

                  {canImpersonate && !!onImpersonateAuthor && (
                    <button
                      onClick={() => setIsImpersonatePickerOpen(true)}
                      className="mt-2 ml-6 mr-3 w-[calc(100%-2.25rem)] px-4 py-2 rounded-lg text-xs font-semibold tracking-wide text-secondary bg-secondary/8 border border-secondary/20 hover:bg-secondary/12 transition-colors"
                    >
                      代入作者视角
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <NavItem to="/articles" icon={Icons.Articles}>文章管理</NavItem>
          )}

          <NavItem to={isAdmin ? "/admin/categories" : "/categories"} icon={Icons.Categories}>分类专栏</NavItem>
          <NavItem to="/tags" icon={Icons.Tags}>标签云</NavItem>
          <NavItem to="/stats" icon={Icons.Stats}>数据统计</NavItem>

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-fg/10">
              <NavItem to="/admin/logs" icon={Icons.Logs}>系统日志</NavItem>
              <NavItem to="/users" icon={Icons.Users}>作者列表</NavItem>
              <NavItem to="/settings" icon={Icons.Settings}>全局配置</NavItem>
            </div>
          )}
          {!isAdmin && (
            <div className="mt-4 pt-4 border-t border-fg/10">
              <NavItem to="/settings" icon={Icons.Settings}>作者配置</NavItem>
            </div>
          )}
        </nav>

        <div className="border-t border-fg/12 bg-surface2/40 py-6 lg:py-8 flex flex-col items-center gap-4 overflow-hidden">
          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center transition-colors duration-200 group focus:outline-none ${collapsed ? 'px-2 py-2' : 'px-6 py-3 w-full'} rounded-xl ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'text-muted' : 'bg-fg/5 hover:bg-fg/8'}`}
          >
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-lg bg-fg/8 flex items-center justify-center text-primary font-semibold border border-fg/12 shadow-inner transition-transform group-hover:scale-[1.02] group-hover:border-primary/25">
              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-lg object-cover" /> : user.username[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left ml-4">
                <p className="text-sm lg:text-base font-semibold text-fg truncate leading-tight">{user.username}</p>
                <p className="text-[11px] text-muted font-mono mt-0.5">{isAdmin ? 'ROOT_ADMIN' : 'AUTHOR_NODE'}</p>
              </div>
            )}
          </button>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className={`flex items-center transition-colors duration-200 group focus:outline-none border border-transparent ${collapsed ? 'w-10 h-10 justify-center text-muted hover:text-danger hover:bg-danger/10 rounded-xl' : 'w-[calc(100%-2rem)] mx-4 py-3 px-5 gap-4 text-sm font-semibold text-muted hover:text-danger hover:bg-danger/10 rounded-xl hover:border-danger/15'}`}
          >
            <IconLabel
              icon={<Icons.Logout />}
              label={collapsed ? null : '退出系统'}
              labelSize="base"
              hoverScale={false}
              labelClassName="flex-none text-sm leading-5 whitespace-nowrap overflow-hidden font-semibold"
            />
          </button>
        </div>
      </aside>

      {isImpersonatePickerOpen && canImpersonate && isAdmin && !!onImpersonateAuthor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-[var(--mt-shadow-3)] overflow-hidden">
            <div className="p-6 border-b border-fg/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-fg">代入作者视角</div>
                <div className="text-[12px] text-muted mt-1">选择一个作者并切换为 Author 身份（可随时返回）</div>
              </div>
              <button
                onClick={() => setIsImpersonatePickerOpen(false)}
                className="w-9 h-9 rounded-xl grid place-items-center text-muted hover:text-fg hover:bg-fg/5 border border-transparent hover:border-fg/10 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-4 space-y-2">
              {users
                .filter(u => u.role === UserRole.AUTHOR && u.status !== UserStatus.PENDING_DELETE)
                .map(u => (
                  <button
                    key={u.id}
                    onClick={async () => {
                      try {
                        await onImpersonateAuthor!(u.id);
                        setIsImpersonatePickerOpen(false);
                      } catch (err) {
                        alert((err as Error).message);
                      }
                    }}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-fg/5 hover:bg-fg/8 border border-fg/10 hover:border-secondary/25 transition-colors"
                  >
                    <span className="text-sm font-semibold text-fg truncate">@{u.username}</span>
                    <span className="text-[12px] font-semibold text-secondary">切换</span>
                  </button>
                ))}
              {users.filter(u => u.role === UserRole.AUTHOR && u.status !== UserStatus.PENDING_DELETE).length === 0 && (
                <div className="text-sm text-muted text-center py-10">暂无可代入的作者</div>
              )}
            </div>
            <div className="p-4 border-t border-fg/10">
              <button
                onClick={() => setIsImpersonatePickerOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-muted hover:text-fg hover:bg-fg/5 border border-fg/10 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto bg-canvas custom-scrollbar relative">
        <div className="p-6 lg:p-10 xl:p-12">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </div>
      </main>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="终端断开请求"
        message="您正请求断开当前管理终端与主集群的身份认证连接。确定断开吗？"
        confirmText="确认退出"
        onConfirm={onLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </div>
  );
};

export default Layout;
