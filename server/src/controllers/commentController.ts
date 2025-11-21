import { Request, Response } from "express";
import Comment from "../models/Comment";
import mongoose from "mongoose";

// ================================
// 发表评论 / 回复评论
// ================================
export const createComment = async (req: Request, res: Response) => {
  try {
    const { articleId, userId, content, replyTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const newComment = await Comment.create({
      articleId,
      userId,
      content,
      replyTo: replyTo || null,
    });

    res.json({
      message: "Comment posted",
      comment: newComment,
    });

  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

// ================================
// 获取文章评论（按时间正序）
// ================================
export const getCommentsByArticle = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const comments = await Comment.find({ articleId })
      .populate("userId", "_id username")
      .sort({ createdAt: 1 });

    res.json({ articleId, comments });

  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ error: "Failed to get comments" });
  }
};

// ================================
// 删除评论
// ================================
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    const deleted = await Comment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({
      message: "Comment deleted",
      id,
    });

  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

