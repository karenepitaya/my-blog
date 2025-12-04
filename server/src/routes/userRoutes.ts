import { Router } from "express";
import { registerUser, loginUser, getMe } from "../controllers/userController";
import { authMiddleware } from "../middleware/auth";
import { validate, userValidators } from "../validators/index";

const router: Router = Router();

/**
 * 注册管理员账号
 * 只允许在未初始化状态使用一次
 */
router.post("/register", validate(userValidators.register), registerUser);

/**
 * 登录并获取 JWT 令牌
 */
router.post("/login", validate(userValidators.login), loginUser);

/**
 * 获取当前登录用户信息
 * 需要 JWT
 */
router.get("/me", authMiddleware, getMe);

export default router;
