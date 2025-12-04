import React from 'react';
import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  articleCount?: number;
}

interface CategoryListProps {
  categories: Category[];
}

const CategoryList: React.FC<CategoryListProps> = ({ categories }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        文章分类
      </h2>
      
      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category._id}>
            <Link
              href={`/category/${category.slug}`}
              className="flex items-center justify-between py-2 px-3 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <span>{category.name}</span>
              {category.articleCount !== undefined && (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">
                  {category.articleCount}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList;
