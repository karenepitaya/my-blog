import { Router } from "express";
import {
  createArticle,
  listArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticleBySlug,
  publishArticle,
  unpublishArticle,
} from "../controllers/articleController";

const router = Router();

router.post("/create", createArticle);
router.get("/list", listArticles);
router.get("/search", searchArticles);
router.get("/:id", getArticleById);
router.get("/slug/:slug", getArticleBySlug);
router.put("/:id", updateArticle);
router.put("/:id/publish", publishArticle);
router.put("/:id/unpublish", unpublishArticle);
router.delete("/:id", deleteArticle);

export default router;

