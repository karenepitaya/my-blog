import React from "react";

interface Author {
  username?: string;
}

interface Category {
  name: string;
  slug: string;
}

export default function ArticleMeta({
  author,
  createdAt,
  category,
}: {
  author?: Author;
  createdAt: string;
  category?: Category | null;
}) {
  return (
    <div className="text-sm text-gray-500 space-x-3 mt-2">
      {author?.username && <span>作者：{author.username}</span>}
      <span>发布于：{new Date(createdAt).toLocaleDateString()}</span>
      {category && (
        <span>
          分类：
          <a
            href={`/category/${category.slug}`}
            className="hover:text-black underline"
          >
            {category.name}
          </a>
        </span>
      )}
    </div>
  );
}
