import { Router } from "express";
import {
  createComment,
  getCommentsByArticle,
  deleteComment
} from "../controllers/commentController";

const router = Router();

router.post("/create", createComment);
router.get("/article/:articleId", getCommentsByArticle);
router.delete("/:id", deleteComment);

export default router;

