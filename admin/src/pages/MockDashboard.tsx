/**
 * MockDashboard - 占位仪表盘
 * 用于验证布局效果
 */

import { motion } from 'motion/react';
import {
  FileText,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  Plus,
} from 'lucide-react';

const stats = [
  { label: '文章总数', value: '128', icon: FileText, change: '+12 本月' },
  { label: '总阅读量', value: '45.2K', icon: Eye, change: '+23% 较上月' },
  { label: '获赞数', value: '3.8K', icon: Heart, change: '+156 本周' },
  { label: '评论数', value: '892', icon: MessageCircle, change: '+45 本周' },
];

const recentArticles = [
  { title: '探索现代前端架构模式', date: '2024-03-08', views: 1234, status: 'published' },
  { title: 'TypeScript 高级类型体操', date: '2024-03-05', views: 892, status: 'published' },
  { title: 'React 性能优化指南', date: '2024-03-01', views: 2156, status: 'published' },
  { title: '设计系统的艺术', date: '2024-02-28', views: 567, status: 'draft' },
];

export function MockDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 pb-8"
    >
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-zinc-900 dark:text-white">
            仪表盘
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            欢迎回来，这里是您的创作概览
          </p>
        </div>
        <button className="
          group flex items-center gap-2 px-4 py-2.5
          bg-zinc-900 dark:bg-white text-white dark:text-zinc-900
          rounded-xl font-medium text-sm
          hover:bg-zinc-800 dark:hover:bg-zinc-100
          transition-all duration-200
          shadow-lg shadow-zinc-900/10 dark:shadow-white/10
        ">
          <Plus className="w-4 h-4" />
          <span>新建文章</span>
        </button>
      </div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-micro mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-zinc-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50">
                <stat.icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {stat.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 最近文章列表 */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-white">
            最近文章
          </h2>
          <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
            查看全部
          </button>
        </div>

        <div className="space-y-3">
          {recentArticles.map((article, index) => (
            <motion.div
              key={article.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className="
                flex items-center justify-between py-3 px-4 rounded-xl
                hover:bg-white/50 dark:hover:bg-zinc-800/50
                transition-colors duration-200
                border border-transparent hover:border-zinc-200/50 dark:hover:border-zinc-700/30
              "
            >
              <div className="flex items-center gap-4">
                <span className={`
                  text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider
                  ${article.status === 'published' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}
                `}>
                  {article.status === 'published' ? '已发布' : '草稿'}
                </span>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {article.title}
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{article.date}</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {article.views}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
