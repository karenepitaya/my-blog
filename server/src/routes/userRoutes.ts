import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

/**
 * 注册管理员账号
 * 只允许在未初始化状态使用一次
 */
router.post("/register", registerUser);

/**
 * 登录（返回 JWT）
 */
router.post("/login", loginUser);

/**
 * 获取当前登录用户信息
 * 需要 JWT
 */
router.get("/me", authMiddleware, getMe);

export default router;
