import { Router } from "express";
import { toggleLike, getLikesCount } from "../controllers/likeController";

const router = Router();

router.post("/toggle", toggleLike);
router.get("/count/:articleId", getLikesCount);

export default router;

