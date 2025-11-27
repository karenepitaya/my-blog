import React from "react";
import Toc from "../components/Toc";
import ArticleMeta from "../components/ArticleMeta";

export default function ArticleLayout({ article }: { article: any }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

      <ArticleMeta
        author={article.author}
        createdAt={article.createdAt}
        category={article.category}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
        {/* 主内容 */}
        <article
          className="prose prose-neutral dark:prose-invert md:col-span-3"
          dangerouslySetInnerHTML={{ __html: article.contentHTML }}
        />

        {/* 目录 */}
        <div className="md:col-span-1 sticky top-20 h-fit">
          <Toc toc={article.toc} />
        </div>
      </div>
    </div>
  );
}
