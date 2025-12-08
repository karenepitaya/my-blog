'use client';
import React from 'react';
import Link from 'next/link';
import SearchBar from './SearchBar';

interface HeaderProps {
  categories?: Array<{ _id: string; name: string; slug: string }>;
}

const Header: React.FC<HeaderProps> = ({ categories = [] }) => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            我的博客
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium"
            >
              首页
            </Link>
            <div className="relative group">
              <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium flex items-center space-x-1">
                <span>分类</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {/* 分类下拉菜单 - 移除mt-2避免显示背景间隙 */}
              <div className="absolute left-0 w-48 bg-white rounded-md shadow-lg py-1 z-10 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hidden group-hover:block">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category._id}
                    href={`/category/${category.slug}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  >
                    {category.name}
                  </Link>
                ))}
                {categories.length > 8 && (
                  <Link
                    href="/categories"
                    className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700"
                  >
                    查看所有分类
                  </Link>
                )}
              </div>
            </div>
            <Link
              href="/about"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium"
            >
              关于
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="w-64">
            <SearchBar />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
