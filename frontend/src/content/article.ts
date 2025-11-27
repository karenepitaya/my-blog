// src/content/article.ts

import {
  fetchArticleBySlug,
  fetchArticleList,
  fetchArticlesByCategory,
} from "@/lib/api";

/**
 * 获取并处理单篇文章内容（通过 slug）
 * UI 层可直接使用：
 *   - article.title
 *   - article.contentHTML
 *   - article.toc
 */
export async function getArticle(slug: string) {
  const data = await fetchArticleBySlug(slug);

  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    coverUrl: data.coverUrl,
    slug: data.slug,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,

    // HTML 内容（已由后端渲染）
    contentHTML: data.contentHTML,

    // Markdown 目录（已解析）
    toc: data.toc,

    // 分类与作者已经在服务端 populate 过
    category: data.category || null,
    author: data.author || null,
  };
}

/**
 * 获取已发布文章列表（用于首页）
 */
export async function getPublishedArticles() {
  const list = await fetchArticleList();

  return list.articles.map((a: any) => ({
    id: a._id,
    title: a.title,
    summary: a.summary,
    slug: a.slug,
    coverUrl: a.coverUrl,
    createdAt: a.createdAt,
    category: a.category || null,
  }));
}

/**
 * 获取某分类下的文章列表
 */
export async function getArticlesByCategory(categoryId: string) {
  const list = await fetchArticlesByCategory(categoryId);

  return list.articles.map((a: any) => ({
    id: a._id,
    title: a.title,
    summary: a.summary,
    slug: a.slug,
    createdAt: a.createdAt,
    coverUrl: a.coverUrl,
  }));
}

