import { Request, Response } from "express";
import Like from "../models/Like";
import mongoose from "mongoose";

// 点赞 / 取消点赞（toggle）
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const { articleId, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // 判断是否已点赞
    const exist = await Like.findOne({ articleId, userId });

    if (exist) {
      // 已有 → 取消点赞
      await Like.deleteOne({ _id: exist._id });
      return res.json({ liked: false, message: "Unliked successfully" });
    }

    // 未点赞 → 点赞
    await Like.create({ articleId, userId });
    return res.json({ liked: true, message: "Liked successfully" });

  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

// 获取文章点赞数
export const getLikesCount = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      return res.status(400).json({ error: "Invalid article ID" });
    }

    const count = await Like.countDocuments({ articleId });

    res.json({ articleId, likes: count });
  } catch (error) {
    console.error("Get likes count error:", error);
    res.status(500).json({ error: "Failed to get likes count" });
  }
};

