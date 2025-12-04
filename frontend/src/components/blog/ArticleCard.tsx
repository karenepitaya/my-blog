'use client'; // 标记为客户端组件
import React from 'react';
import Link from 'next/link'; // 使用Next.js的Link组件
import { ArticleListItem } from '@/lib/api';

interface ArticleCardProps {
  article: ArticleListItem;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
      {/* 文章封面图 */}
      {article.coverUrl && (
        <div className="h-48 overflow-hidden">
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
          />
        </div>
      )}

      {/* 文章内容 */}
      <div className="p-6">
        {/* 分类标签 */}
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="inline-block text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full mb-3"
          >
            {article.category.name}
          </Link>
        )}

        {/* 文章标题 */}
        <h3 className="text-xl font-bold mb-2">
          <Link
            href={`/article/${article.slug}`}
            className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
          >
            {article.title}
          </Link>
        </h3>

        {/* 文章摘要 */}
        {article.summary && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
            {article.summary}
          </p>
        )}

        {/* 作者和日期信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
          <div className="flex items-center space-x-2">
            {article.author && (
              <span className="font-medium">{article.author.username}</span>
            )}
            <span>·</span>
            <span>{formatDate(article.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;
