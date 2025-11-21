import { Request, Response } from "express";
import mongoose from "mongoose";
import Article from "../models/Article";
import { markdownToHtml } from "../utils/markdown";
import { extractToc } from "../utils/toc";
import { createSlug } from "../utils/slug";

// =========================
// 创建文章（含 slug + 分类）
// =========================
export const createArticle = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      summary,
      coverUrl,
      tags,
      authorId,
      categoryId,
    } = req.body;

    if (!title || !content || !authorId) {
      return res
        .status(400)
        .json({ error: "title, content, authorId are required" });
    }

    const rawSlug = createSlug(title);
    let slug = rawSlug;

    const exists = await Article.findOne({ slug });
    if (exists) {
      slug = `${rawSlug}-${Date.now().toString(36)}`;
    }

    const newArticle = await Article.create({
      title,
      content,
      summary,
      coverUrl,
      tags: tags || [],
      author: authorId,
      category: categoryId || null,
      status: "draft",
      slug,
    });

    res.json({
      message: "Article created successfully",
      article: newArticle,
    });
  } catch (error) {
    console.error("Create article error:", error);
    res.status(500).json({ error: "Failed to create article" });
  }
};

// =========================
// 获取文章列表（支持分类过滤）
// =========================
export const listArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      tag,
      authorId,
      categoryId,
      status,
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);

    const filter: any = {};

    if (tag) filter.tags = tag;
    if (authorId) filter.author = authorId;
    if (categoryId) filter.category = categoryId; // 这里才有 categoryId
    if (status) filter.status = status;

    const articles = await Article.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * sizeNum)
      .limit(sizeNum);

    res.json({
      page: pageNum,
      pageSize: sizeNum,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("List articles error:", error);
    res.status(500).json({ error: "Failed to list articles" });
  }
};

// =========================
// 获取单篇文章（支持 Markdown 渲染）
// =========================
export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { render } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (render === "1") {
      return res.json({
        ...article.toObject(),
        contentHTML: markdownToHtml(article.content),
        toc: extractToc(article.content),
      });
    }

    res.json(article);
  } catch (error) {
    console.error("Get article error:", error);
    res.status(500).json({ error: "Failed to get article" });
  }
};

// =========================
// 根据 slug 获取文章（支持 HTML 渲染 & TOC）
// =========================
export const getArticleBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { render } = req.query;

    const article = await Article.findOne({ slug });

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    if (render === "1") {
      return res.json({
        ...article.toObject(),
        contentHTML: markdownToHtml(article.content),
        toc: extractToc(article.content),
      });
    }

    res.json(article);
  } catch (error) {
    console.error("Get article by slug error:", error);
    res.status(500).json({ error: "Failed to get article by slug" });
  }
};

// =========================
// 更新文章
// =========================
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const {
      title,
      content,
      summary,
      coverUrl,
      tags,
      isPublished,
      categoryId,
    } = req.body;

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (coverUrl !== undefined) updateData.coverUrl = coverUrl;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (categoryId !== undefined) updateData.category = categoryId;

    const updatedArticle = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedArticle) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({
      message: "Article updated successfully",
      article: updatedArticle,
    });
  } catch (error) {
    console.error("Update article error:", error);
    res.status(500).json({ error: "Failed to update article" });
  }
};

// =========================
// 删除文章
// =========================
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const deleted = await Article.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({
      message: "Article deleted successfully",
      deletedArticleId: id,
    });
  } catch (error) {
    console.error("Delete article error:", error);
    res.status(500).json({ error: "Failed to delete article" });
  }
};

// =========================
// 搜索文章（支持分类过滤）
// =========================
export const searchArticles = async (req: Request, res: Response) => {
  try {
    const {
      keyword = "",
      page = 1,
      pageSize = 10,
      tag,
      authorId,
      categoryId,
    } = req.query;

    const pageNum = Number(page);
    const sizeNum = Number(pageSize);

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    if (tag) filter.tags = tag;
    if (authorId) filter.author = authorId;
    if (categoryId) filter.category = categoryId;

    const articles = await Article.find(filter)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * sizeNum)
      .limit(sizeNum);

    res.json({
      page: pageNum,
      pageSize: sizeNum,
      count: articles.length,
      articles,
    });
  } catch (error) {
    console.error("Search article error:", error);
    res.status(500).json({ error: "Failed to search articles" });
  }
};

// =========================
// 发布文章 
// =========================
export const publishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const updated = await Article.findByIdAndUpdate(
      id,
      { status: "published" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({
      message: "Article published successfully",
      article: updated,
    });
  } catch (error) {
    console.error("Publish article error:", error);
    res.status(500).json({ error: "Failed to publish article" });
  }
};

// =========================
// 撤销发布
// =========================
export const unpublishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const updated = await Article.findByIdAndUpdate(
      id,
      { status: "draft" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Article not found" });
    }

    res.json({
      message: "Article set to draft",
      article: updated,
    });
  } catch (error) {
    console.error("Unpublish article error:", error);
    res.status(500).json({ error: "Failed to unpublish article" });
  }
};

