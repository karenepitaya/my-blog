import React from 'react';
import Header from '@/components/blog/Header';
import { categoryApi } from '@/lib/api';

export default async function NotFound() {
  // 获取分类数据用于Header
  const categories = await categoryApi.getList();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header categories={categories} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          抱歉，您访问的页面不存在
        </p>
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          返回首页
        </a>
      </main>
    </div>
  );
}