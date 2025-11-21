import { Request, Response } from "express";
import Favorite from "../models/Favorite";
import mongoose from "mongoose";

// 收藏 / 取消收藏（toggle）
export const toggleFavorite = async (req: Request, res: Response) => {
  try {
    const { articleId, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // 是否已收藏？
    const exist = await Favorite.findOne({ articleId, userId });

    if (exist) {
      await Favorite.deleteOne({ _id: exist._id });
      return res.json({ favorited: false, message: "Unfavorited successfully" });
    }

    await Favorite.create({ articleId, userId });
    return res.json({ favorited: true, message: "Favorited successfully" });

  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({ error: "Failed to toggle favorite" });
  }
};

// 获取文章收藏数
export const getFavoritesCount = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const count = await Favorite.countDocuments({ articleId });

    res.json({ articleId, favorites: count });
  } catch (error) {
    console.error("Get favorites count error:", error);
    res.status(500).json({ error: "Failed to get favorites count" });
  }
};

// 获取某用户所有收藏文章（前端会用）
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const favorites = await Favorite.find({ userId })
      .populate("articleId", "_id title slug summary coverUrl createdAt");

    res.json({ userId, favorites });
  } catch (error) {
    console.error("Get user favorites error:", error);
    res.status(500).json({ error: "Failed to get user favorites" });
  }
};

