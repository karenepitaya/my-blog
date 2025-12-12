import { Router } from "express";
import {
  createComment,
  getCommentsByArticle,
  deleteComment
} from "../controllers/commentController";

import { authMiddleware, adminOnly } from "../middleware/auth";

const router: Router = Router();

/**
 * 创建评论，需要登录
 * userId 会从 body 取出来，不需要修改 controller
 */
router.post("/create", authMiddleware, createComment);

/**
 * 获取某篇文章的全部评论，不需要登录
 */
router.get("/article/:articleId", getCommentsByArticle);

/**
 * 删除评论，需要管理员权限
 */
router.delete("/:id", authMiddleware, adminOnly, deleteComment);

export default router;
