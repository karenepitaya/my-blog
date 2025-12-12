import { Router } from "express";
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";

import { authMiddleware, adminOnly } from "../middleware/auth";
import { validate, categoryValidators } from "../validators/index";

const router: Router = Router();

// 管理员路由：创建 / 更新 / 删除分类
router.post("/create", authMiddleware, adminOnly, validate(categoryValidators.create), createCategory);
router.put("/:id", authMiddleware, adminOnly, validate(categoryValidators.update), updateCategory);
router.delete("/:id", authMiddleware, adminOnly, deleteCategory);

// 前端路由：分类列表查询
router.get("/list", listCategories);

export default router;