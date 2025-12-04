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
import { validate, articleValidators } from "../validators/index";

const router: Router = Router();

// ========= 管理员路由：需要登录 + admin权限 =========
router.post("/create", authMiddleware, adminOnly, validate(articleValidators.create), createArticle);
router.put("/:id", authMiddleware, adminOnly, validate(articleValidators.update), updateArticle);
router.delete("/:id", authMiddleware, adminOnly, deleteArticle);
router.post("/:id/publish", authMiddleware, adminOnly, publishArticle);
router.post("/:id/unpublish", authMiddleware, adminOnly, unpublishArticle);

// ========= 前端接口：不需要登录 =========
router.get("/list", listArticles);
router.get("/search", searchArticles);
router.get("/slug/:slug", getArticleBySlug);
router.get("/:id", getArticleById);

export default router;
