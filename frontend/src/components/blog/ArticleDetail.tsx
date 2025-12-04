import React from 'react';
import Link from 'next/link';
import { ArticleDetail as ArticleDetailType } from '@/lib/api';
import Toc from './Toc';

interface ArticleDetailProps {
  article: ArticleDetailType;
}

const ArticleDetail: React.FC<ArticleDetailProps> = ({ article }) => {
  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <article className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* 文章封面图 */}
      {article.coverUrl && (
        <div className="h-64 md:h-80 overflow-hidden">
          <img
            src={article.coverUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* 文章内容 */}
      <div className="p-6 md:p-10">
        {/* 分类标签 */}
        {article.category && (
          <Link
            href={`/category/${article.category.slug}`}
            className="inline-block text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full mb-4"
          >
            {article.category.name}
          </Link>
        )}

        {/* 文章标题 */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">
          {article.title}
        </h1>

        {/* 作者和日期信息 */}
        <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-gray-500 dark:text-gray-400">
          {article.author && (
            <div className="flex items-center gap-2">
              <span className="font-medium">作者：{article.author.username}</span>
            </div>
          )}
          <div>
            <span>发布于：{formatDate(article.createdAt)}</span>
          </div>
          {article.updatedAt && article.updatedAt !== article.createdAt && (
            <div>
              <span>更新于：{formatDate(article.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* 文章摘要 */}
        {article.summary && (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border-l-4 border-blue-500 mb-8">
            <p className="text-gray-700 dark:text-gray-300 italic">{article.summary}</p>
          </div>
        )}

        {/* 主要内容和目录 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 文章主要内容 */}
          <div className="lg:col-span-3">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: article.contentHTML || '' }}
            />
          </div>

          {/* 文章目录 */}
          {article.toc && article.toc.length > 0 && (
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <Toc toc={article.toc} />
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ArticleDetail;
