import { Router } from "express";
import {
  createArticle,
  listArticles,
  getArticleById,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  searchArticles,
  publishArticle,
  unpublishArticle,
} from "../controllers/articleController";
import { authMiddleware, adminOnly } from "../middleware/auth";

const router = Router();

// ========= 管理端（需要登录 + admin） =========
router.post("/create", authMiddleware, adminOnly, createArticle);
router.put("/:id", authMiddleware, adminOnly, updateArticle);
router.delete("/:id", authMiddleware, adminOnly, deleteArticle);
router.post("/:id/publish", authMiddleware, adminOnly, publishArticle);
router.post("/:id/unpublish", authMiddleware, adminOnly, unpublishArticle);

// ========= 前台公开接口（无需登录） =========
router.get("/list", listArticles);
router.get("/search", searchArticles);
router.get("/slug/:slug", getArticleBySlug);
router.get("/:id", getArticleById);

export default router;
