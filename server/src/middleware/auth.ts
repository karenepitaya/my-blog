import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// token 里解出来的用户结构
interface JwtUserPayload {
  id: string;
  username: string;
  role: string;
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

// 2）管理员专用校验（目前你只有 admin，留好扩展位）
export const adminOnly = (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }

  next();
};
