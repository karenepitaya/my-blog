import { Request, Response, NextFunction } from "express";

interface AuthPayload {
  id: string;
  username: string;
  role: "super_admin" | "admin" | "user";
  status?: "active" | "inactive" | "suspended";
}

/**
 * 管理员权限中间件
 * 确保用户具有管理员或超级管理员权限
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user as AuthPayload | undefined;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // 检查用户角色是否为管理员或超级管理员
    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({
        error: "Access denied - admin privileges required",
        currentRole: user.role,
      });
    }

    // 检查用户状态是否为活跃（老 token 没有 status 时默认视为 active）
    if (user.status && user.status !== "active") {
      return res.status(403).json({
        error: "Access denied - account is inactive",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 超级管理员权限中间件
 * 确保用户具有超级管理员权限
 */
export const superAdminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as any).user as AuthPayload | undefined;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // 检查用户角色是否为超级管理员
    if (user.role !== "super_admin") {
      return res.status(403).json({
        error: "Access denied - super admin privileges required",
        currentRole: user.role,
      });
    }

    // 检查用户状态是否为活跃（老 token 没有 status 时默认视为 active）
    if (user.status && user.status !== "active") {
      return res.status(403).json({
        error: "Access denied - account is inactive",
      });
    }

    next();
  } catch (error) {
    console.error("Super admin middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
