import React from 'react';
import { articleApi, categoryApi } from '@/lib/api';
import Header from '@/components/blog/Header';
import ArticleDetail from '@/components/blog/ArticleDetail';
import CategoryList from '@/components/blog/CategoryList';

interface ArticlePageProps {
  params: { slug: string };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // 在Next.js 16+中，params是一个Promise，需要使用await来解包
  const { slug } = await params;
  
  // 并行获取文章详情和分类数据
  try {
    // 使用Promise.all并行调用API以提高性能
    const [article, categories] = await Promise.all([
      articleApi.getBySlug(slug),
      categoryApi.getList()
    ]);
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header categories={categories} />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 文章详情 */}
          <div className="mb-12">
            <ArticleDetail article={article} />
          </div>
        </main>
      </div>
    );
  } catch (error) {
    // 返回一个错误页面
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-500">Failed to load article: {error instanceof Error ? error.message : 'Unknown error'}</p>
          <p className="mt-2">Slug: {slug}</p>
        </div>
      </div>
    );
  }
}
