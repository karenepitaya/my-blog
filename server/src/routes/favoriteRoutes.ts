import { Router } from "express";
import {
  toggleFavorite,
  getFavoritesCount,
  getUserFavorites
} from "../controllers/favoriteController";

const router = Router();

router.post("/toggle", toggleFavorite);
router.get("/count/:articleId", getFavoritesCount);
router.get("/user/:userId", getUserFavorites);

export default router;

