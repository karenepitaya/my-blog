import React, { Suspense } from 'react';
import { articleApi, categoryApi } from '@/lib/api';
import Header from '@/components/blog/Header';
import ArticleCard from '@/components/blog/ArticleCard';
import CategoryList from '@/components/blog/CategoryList';

interface CategoryPageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params;
  
  // 先获取所有分类
  const categories = await categoryApi.getList();
  
  // 查找当前分类信息
  const currentCategory = categories.find(cat => cat.slug === slug);
  
  // 根据分类ID获取文章列表
  const articles = currentCategory 
    ? await articleApi.getList({ categoryId: currentCategory._id, page: 1, pageSize: 10 })
    : { articles: [], page: 1, pageSize: 10, count: 0 };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Suspense fallback={<div>Loading...</div>}>
        <Header categories={categories} />
      </Suspense>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          分类：{currentCategory?.name || '未找到'}
        </h1>

        {/* 文章列表和分类 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 文章列表 */}
          <div className="lg:col-span-3 space-y-6">
            {articles.articles.length > 0 ? (
              articles.articles.map((article) => (
                <ArticleCard key={article._id} article={article} />
              ))
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-10 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  该分类下暂无文章
                </p>
              </div>
            )}

            {/* 分页 */}
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  disabled={articles.page === 1}
                  className="px-4 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                  第 {articles.page} 页，共 {Math.ceil(articles.count / articles.pageSize)} 页
                </span>
                <button
                  disabled={articles.page * articles.pageSize >= articles.count}
                  className="px-4 py-2 rounded-md bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  下一页
                </button>
              </nav>
            </div>
          </div>

          {/* 分类列表 */}
          <div className="lg:col-span-1">
            <CategoryList categories={categories} />
          </div>
        </div>
      </main>
    </div>
  );
}
