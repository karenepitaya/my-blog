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
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, users, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true);
  const [isRecycleExpanded, setIsRecycleExpanded] = useState(true);
  const isAdmin = user.role === UserRole.ADMIN;
  const navigate = useNavigate();
  const location = useLocation();

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
        flex items-center rounded-xl transition-all duration-300 mx-3 group relative border
        ${isActive
          ? 'bg-[#44475a]/80 text-[#bd93f9] border-[#bd93f9]/40 shadow-[0_0_15px_rgba(189,147,249,0.25)]'
          : 'border-transparent text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/30 hover:shadow-[0_0_10px_rgba(68,71,90,0.2)]'}
        ${collapsed ? 'justify-center h-10 w-10 mx-auto mb-2' : 'px-4 py-3 mb-1.5 gap-3.5'}
      `}
    >
      <IconLabel icon={<Icon />} label={collapsed ? null : children} labelSize="lg" hoverScale={!collapsed} />
      {!collapsed && (
        <div className={`absolute right-3 w-1.5 h-1.5 rounded-full bg-[#bd93f9] shadow-[0_0_5px_#bd93f9] transition-opacity duration-300 ${window.location.hash.endsWith(to) || (to !== '/' && window.location.hash.includes(to)) ? 'opacity-100' : 'opacity-0'}`} />
      )}
    </NavLink>
  );

  const SubItem: React.FC<{ to: string; label: string }> = ({ to, label }) => {
    const isActive = location.pathname + location.search === to;

    return (
      <NavLink
        to={to}
        className={`
          flex items-center py-2 px-5 ml-6 mr-3 rounded-lg text-sm lg:text-base font-medium transition-all mb-1 group border border-transparent
          ${isActive 
            ? 'text-[#bd93f9] bg-[#bd93f9]/10 border-[#bd93f9]/20 shadow-[0_0_10px_rgba(189,147,249,0.15)]' 
            : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/10'}
        `}
      >
        <span className="truncate">{label}</span>
      </NavLink>
    );
  };

  return (
    <div className="admin-theme flex h-screen bg-[var(--admin-ui-bg)] font-sans overflow-hidden text-[#f8f8f2]">
      <aside
        className={`border-r border-[#44475a] bg-[#21222c] flex flex-col shrink-0 transition-all duration-300 ease-in-out z-50 ${collapsed ? 'w-16' : 'w-64 lg:w-72'}`}
      >
        <div className={`flex flex-col border-b border-[#44475a]/40 ${collapsed ? 'py-5 items-center' : 'p-6 lg:p-7'}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'mb-4' : 'mb-0 justify-between w-full'}`}>
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-[#bd93f9] shadow-[0_0_8px_#bd93f9] shrink-0 animate-pulse" />
              {!collapsed && (
                <h1 className="text-lg lg:text-xl font-black tracking-tighter uppercase italic truncate bg-clip-text text-transparent bg-gradient-to-r from-[#bd93f9] to-[#ff79c6]">
                  MultiTerm
                </h1>
              )}
            </div>
            {!collapsed && !isMobile && (
              <button onClick={() => setCollapsed(true)} className="text-[#6272a4] hover:text-[#bd93f9] transition-colors p-1">
                <span className="font-mono text-xs opacity-60">[×]</span>
              </button>
            )}
          </div>
          {collapsed && !isMobile && (
            <button onClick={() => setCollapsed(false)} className="text-[#6272a4] hover:text-[#bd93f9] transition-colors mt-1">
              <span className="font-mono text-xs opacity-60">[+]</span>
            </button>
          )}
        </div>

        <nav className="flex-1 py-4 lg:py-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <NavItem to="/" icon={Icons.Dashboard}>控制台总览</NavItem>

          {isAdmin ? (
            <div>
              <div
                onClick={() => {
                  if (collapsed) {
                    navigate('/articles');
                  } else {
                    setIsArticlesExpanded(!isArticlesExpanded);
                    if (!location.pathname.startsWith('/articles')) navigate('/articles');
                  }
                }}
                className={`flex items-center rounded-xl transition-all duration-300 mx-3 cursor-pointer group relative mb-1.5 px-4 py-3 gap-3.5 border border-transparent
                  ${location.pathname.startsWith('/articles')
                    ? 'bg-[#44475a]/80 text-[#bd93f9] border-[#bd93f9]/40 shadow-[0_0_15px_rgba(189,147,249,0.25)]'
                    : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/30 hover:shadow-[0_0_10px_rgba(68,71,90,0.2)]'}
                  ${collapsed ? 'justify-center h-10 w-10 mx-auto' : ''}
                `}
              >
                <IconLabel icon={<Icons.Articles />} label={collapsed ? null : '文章管理'} labelSize="responsive" hoverScale />
                {!collapsed && (
                  <span className={`text-[10px] leading-none shrink-0 self-center transition-transform duration-300 ${isArticlesExpanded ? 'rotate-90' : ''}`}>›</span>
                )}
              </div>

              {!collapsed && isArticlesExpanded && (
                <div className="mb-3 animate-in slide-in-from-top-1 duration-200 border-l border-[#44475a] ml-8 pl-2">
                  {users
                    .filter(u => u.role === UserRole.AUTHOR && u.status !== UserStatus.PENDING_DELETE)
                    .map(u => (
                      <SubItem key={u.id} to={`/articles?authorId=${u.id}`} label={`@${u.username}`} />
                    ))}
                </div>
              )}
            </div>
          ) : (
            <NavItem to="/articles" icon={Icons.Articles}>文章管理</NavItem>
          )}

          <NavItem to="/categories" icon={Icons.Categories}>分类专栏</NavItem>
          <NavItem to="/tags" icon={Icons.Tags}>标签云</NavItem>
          <NavItem to="/stats" icon={Icons.Stats}>数据统计</NavItem>

          {isAdmin && (
            <div className="mt-4 pt-4 border-t border-[#44475a]/20">
              <NavItem to="/users" icon={Icons.Users}>作者列表</NavItem>
              <NavItem to="/settings" icon={Icons.Settings}>全局配置</NavItem>
              <div>
                <div
                  onClick={() => {
                    if (collapsed) {
                      navigate('/recycle-bin?type=author');
                    } else {
                      setIsRecycleExpanded(!isRecycleExpanded);
                      if (!location.pathname.startsWith('/recycle-bin')) {
                        navigate('/recycle-bin?type=author');
                      }
                    }
                  }}
                  className={`flex items-center rounded-xl transition-all duration-300 mx-3 cursor-pointer group relative mb-1.5 px-4 py-3 gap-3.5 border border-transparent
                    ${location.pathname.startsWith('/recycle-bin')
                      ? 'bg-[#44475a]/80 text-[#bd93f9] border-[#bd93f9]/40 shadow-[0_0_15px_rgba(189,147,249,0.25)]'
                      : 'text-[#6272a4] hover:text-[#f8f8f2] hover:bg-[#44475a]/30 hover:shadow-[0_0_10px_rgba(68,71,90,0.2)]'}
                    ${collapsed ? 'justify-center h-10 w-10 mx-auto' : ''}
                  `}
                >
                  <IconLabel icon={<Icons.Trash />} label={collapsed ? null : '系统回收站'} labelSize="responsive" hoverScale />
                  {!collapsed && (
                    <span className={`text-[10px] leading-none shrink-0 self-center transition-transform duration-300 ${isRecycleExpanded ? 'rotate-90' : ''}`}>›</span>
                  )}
                </div>

                {!collapsed && isRecycleExpanded && (
                  <div className="mb-3 animate-in slide-in-from-top-1 duration-200 border-l border-[#44475a] ml-8 pl-2">
                    <SubItem to="/recycle-bin?type=author" label="作者回收站" />
                    <SubItem to="/recycle-bin?type=category" label="分类回收站" />
                    <SubItem to="/recycle-bin?type=article" label="文章回收站" />
                  </div>
                )}
              </div>
            </div>
          )}
          {!isAdmin && (
            <div className="mt-4 pt-4 border-t border-[#44475a]/20">
              <NavItem to="/settings" icon={Icons.Settings}>作者配置</NavItem>
            </div>
          )}
        </nav>

        <div className="border-t border-[#44475a]/60 bg-[#191a21]/40 py-6 lg:py-8 flex flex-col items-center gap-4 overflow-hidden">
          <button
            onClick={() => navigate('/settings')}
            className={`flex items-center transition-all duration-300 group focus:outline-none ${collapsed ? 'px-2 py-2' : 'px-6 py-3 w-full'} rounded-xl ${collapsed ? 'justify-center' : 'justify-between'} ${collapsed ? 'text-[#6272a4]' : 'bg-[#44475a]/30 hover:bg-[#44475a]/50'}`}
          >
            <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-lg bg-[#44475a] flex items-center justify-center text-[#bd93f9] font-black border border-[#6272a4] shadow-inner transition-transform group-hover:scale-105 group-hover:border-[#bd93f9]">
              {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-lg object-cover" /> : user.username[0].toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 text-left ml-4">
                <p className="text-sm lg:text-base font-black text-[#f8f8f2] truncate leading-tight group-hover:text-[#bd93f9] transition-colors">{user.username}</p>
                <p className="text-[10px] text-[#6272a4] font-black uppercase tracking-widest mt-0.5">{isAdmin ? 'ROOT_ADMIN' : 'AUTHOR_NODE'}</p>
              </div>
            )}
          </button>
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className={`flex items-center transition-all duration-300 active:scale-95 group focus:outline-none border border-transparent ${collapsed ? 'w-10 h-10 justify-center text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-xl' : 'w-[calc(100%-2rem)] mx-4 py-3 px-5 gap-4 text-sm font-bold text-[#6272a4] hover:text-[#ff5545] hover:bg-[#ff5545]/10 rounded-xl hover:border-[#ff5545]/20 hover:shadow-[0_0_10px_rgba(255,85,69,0.1)]'}`}
          >
            <IconLabel
              icon={<Icons.Logout />}
              label={collapsed ? null : '退出系统'}
              labelSize="base"
              hoverScale={false}
              labelClassName="flex-none text-sm leading-5 whitespace-nowrap overflow-hidden font-black"
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[var(--admin-ui-bg)] custom-scrollbar relative">
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
