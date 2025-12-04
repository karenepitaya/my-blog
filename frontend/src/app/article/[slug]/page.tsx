import React, { Suspense } from 'react';
import { articleApi, categoryApi } from '@/lib/api';
import Header from '@/components/blog/Header';
import ArticleDetail from '@/components/blog/ArticleDetail';
import CategoryList from '@/components/blog/CategoryList';

interface ArticlePageProps {
  params: { slug: string };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  // 在Next.js 13+中，params是一个Promise，需要使用await来获取
  const { slug } = await params;
  
  // 并行获取文章详情和分类数据
  const [article, categories] = await Promise.all([
    articleApi.getBySlug(slug),
    categoryApi.getList()
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<div>Loading...</div>}>
        <Header categories={categories} />
      </Suspense>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 文章详情 */}
        <div className="mb-12">
          <ArticleDetail article={article} />
        </div>
      </main>
    </div>
  );
}
