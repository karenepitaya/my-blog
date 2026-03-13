/**
 * Sidebar - 悬浮编辑风侧边栏
 * 复用登录页角色切换器的弹簧动画交互
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Feather,
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tag,
  Settings,
  LogOut,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: '概览',
    items: [
      { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard className="w-4 h-4" /> },
    ],
  },
  {
    title: '内容管理',
    items: [
      { id: 'articles', label: '文章管理', icon: <FileText className="w-4 h-4" /> },
      { id: 'categories', label: '分类管理', icon: <FolderOpen className="w-4 h-4" /> },
      { id: 'tags', label: '标签管理', icon: <Tag className="w-4 h-4" /> },
    ],
  },
  {
    title: '系统',
    items: [
      { id: 'settings', label: '系统设置', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export function Sidebar() {
  const [activeId, setActiveId] = useState('dashboard');

  return (
    <div className="glass-sidebar h-full w-56 flex flex-col p-5">
      {/* ========== 品牌标识区 ========== */}
      <div className="flex items-center gap-3 mb-8 px-1">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg"
        >
          <Feather className="h-5 w-5" />
        </motion.div>
        <div>
          <h1 className="font-serif text-lg font-bold text-zinc-900 dark:text-white tracking-widest">
            字里行间
          </h1>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wide">
            创作后台
          </p>
        </div>
      </div>

      {/* ========== 导航菜单 ========== */}
      <nav className="flex-1 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title}>
            {/* 分组标题 - 微型标签样式 */}
            <h3 className="text-micro mb-3 px-3">{group.title}</h3>

            {/* 导航项 - 复用登录页弹簧动画 */}
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveId(item.id)}
                    className={`
                      relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      text-sm font-bold transition-all duration-300
                      ${activeId === item.id ? 'nav-pill-active' : 'nav-pill-inactive'}
                    `}
                  >
                    {/* 选中态背景 - 登录页同款弹簧动画 */}
                    {activeId === item.id && (
                      <motion.div
                        layoutId="sidebar-active-pill"
                        className="absolute inset-0 bg-zinc-900 dark:bg-white rounded-xl shadow-sm -z-10"
                        initial={false}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 25,
                        }}
                      />
                    )}

                    {/* 图标 */}
                    <span
                      className={
                        activeId === item.id
                          ? 'text-white dark:text-zinc-900'
                          : 'text-zinc-400 dark:text-zinc-500'
                      }
                    >
                      {item.icon}
                    </span>

                    {/* 标签 */}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ========== 底部操作区 ========== */}
      <div className="pt-4 border-t border-zinc-200/50 dark:border-zinc-700/30">
        <button
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-bold text-zinc-500 dark:text-zinc-400
            hover:text-red-600 dark:hover:text-red-400
            transition-colors duration-200
          "
        >
          <LogOut className="w-4 h-4" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );
}
