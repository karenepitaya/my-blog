import { Router } from "express";
import {
  createCategory,
  listCategories,
  deleteCategory,
} from "../controllers/categoryController";

import { authMiddleware, adminOnly } from "../middleware/auth";

const router = Router();

// 管理端：新建 / 修改 / 删除分类（目前你只实现了 create）
router.post("/create", authMiddleware, adminOnly, createCategory);
router.delete("/:id", authMiddleware, adminOnly, deleteCategory);

// 前台：分类列表公开
router.get("/list", listCategories);

export default router;