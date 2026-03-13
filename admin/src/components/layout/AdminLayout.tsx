/**
 * AdminLayout - 沉浸式全局布局
 * 符合「沉浸式/编辑风」设计规范
 */

import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';

export function AdminLayout() {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return theme === 'dark';
    };
    setIsDark(checkDark());
  }, [theme]);

  return (
    <div className="h-screen w-full relative overflow-hidden font-sans">
      {/* ========== 背景层（继承登录页的背景逻辑）========== */}
      <div className="absolute inset-0 z-0 bg-zinc-100 dark:bg-zinc-950 transition-colors duration-700">
        {/* 日间背景 */}
        <img
          src="https://picsum.photos/seed/brightworkspace/1920/1080?blur=4"
          alt="Day background"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 ${
            isDark ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* 夜间背景 */}
        <img
          src="https://picsum.photos/seed/darknightscape/1920/1080?blur=4"
          alt="Night background"
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 ${
            isDark ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* ========== 极强高斯模糊遮罩层 ========== */}
      <div className="absolute inset-0 z-[1] immersive-backdrop transition-colors duration-700" />

      {/* ========== 主布局层 ========== */}
      <div className="relative z-10 h-full w-full flex p-4 gap-4">
        {/* 左侧：悬浮侧边栏 */}
        <aside className="flex-shrink-0 h-full">
          <Sidebar />
        </aside>

        {/* 右侧：内容区域 */}
        <main className="flex-1 h-full overflow-hidden flex flex-col">
          {/* 顶部工具栏 */}
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
          
          {/* 内容滚动区 */}
          <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
