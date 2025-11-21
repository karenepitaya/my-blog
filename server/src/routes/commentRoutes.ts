import { Router } from "express";
import {
  createComment,
  getCommentsByArticle,
  deleteComment
} from "../controllers/commentController";

import { authMiddleware, adminOnly } from "../middleware/auth";

const router = Router();

/**
 * 发表评论（需要登录）
 * userId 不再从 body 取，后面会告诉你怎么修改 controller
 */
router.post("/create", authMiddleware, createComment);

/**
 * 获取某篇文章的全部评论（公开）
 */
router.get("/article/:articleId", getCommentsByArticle);

/**
 * 删除评论（仅管理员）
 */
router.delete("/:id", authMiddleware, adminOnly, deleteComment);

export default router;
