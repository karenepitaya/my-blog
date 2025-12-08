import React from 'react';
import { categoryApi } from '@/lib/api';
import Header from '@/components/blog/Header';

export default async function About() {
  // 获取分类数据，与其他页面保持一致
  const categories = await categoryApi.getList();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header categories={categories} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">关于我</h1>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            这是一个使用Next.js和React构建的现代博客应用。
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            您可以在这里分享您的想法和知识。
          </p>
        </div>
      </main>
    </div>
  );
}
