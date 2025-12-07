import { Router } from "express";
import { registerUser, loginUser, getMe, deactivateUser, getUsers, updateUser, deleteUser } from "../controllers/userController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";
import { adminMiddleware, superAdminMiddleware } from "../middleware/admin";
import { validate, userValidators } from "../validators/index";

const router: Router = Router();

/**
 * 注册管理员账号
 * 只允许在未初始化状态使用一次
 */
router.post("/register", optionalAuthMiddleware, validate(userValidators.register), registerUser);

/**
 * 登录并获取 JWT 令牌
 */
router.post("/login", validate(userValidators.login), loginUser);

/**
 * 获取当前登录用户信息
 * 需要 JWT
 */
router.get("/me", authMiddleware, getMe);

/**
 * 注销当前用户（软删除）
 * 需要 JWT 和密码确认
 * 注销后允许重新注册新的管理员账号
 */
router.post("/deactivate", authMiddleware, deactivateUser);

/**
 * 获取用户列表（管理员功能）
 * 需要 JWT 和管理员权限
 */
router.get("/", authMiddleware, adminMiddleware, getUsers);

/**
 * 更新用户信息（管理员功能）
 * 需要 JWT 和管理员权限
 */
router.put("/:id", authMiddleware, adminMiddleware, validate(userValidators.update), updateUser);

/**
 * 删除用户（超级管理员功能）
 * 需要 JWT 和超级管理员权限
 */
router.delete("/:id", authMiddleware, superAdminMiddleware, deleteUser);

export default router;
