import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// token 里解出来的用户结构
interface JwtUserPayload {
  id: string;
  username: string;
  role: "super_admin" | "admin" | "user";
  status?: "active" | "inactive" | "suspended";
}

// 给当前文件内部用的 Request 类型（其他地方用不到）
type AuthedRequest = Request & {
  user?: JwtUserPayload;
};

// 1）基础鉴权：校验 JWT，解析出用户
export const authMiddleware = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    // 没有 Authorization 或格式不是 Bearer xxx
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // 校验 token（会顺便检查是否过期）
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtUserPayload;

    // 挂到 req 上，后面需要可以用
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// 2）可选鉴权：有 token 则解析，无则跳过
export const optionalAuthMiddleware = (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtUserPayload;
    req.user = decoded;
  } catch (error) {
    console.warn("Optional auth token invalid, continuing as guest");
  }

  next();
};

// 3）管理员/超管校验
export const adminOnly = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  if (req.user.status && req.user.status !== "active") {
    return res.status(403).json({ error: "Account is inactive" });
  }

  next();
};
