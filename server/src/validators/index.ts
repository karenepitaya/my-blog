import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

/**
 * 验证中间件生成器
 */
export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Validation Error",
          details: error.format()._errors.length > 0 ? 
            [{ field: "body", message: error.format()._errors.join(", ") }] :
            Object.entries(error.format()).map(([field, value]) => ({
              field: field === "_errors" ? "body" : field,
              message: Array.isArray(value._errors) ? value._errors.join(", ") : value._errors
            })).filter(item => item.field !== "body")
        });
      } else {
        next(error);
      }
    }
  };
}

/**
 * 用户验证器
 */
export const userValidators = {
  register: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(6).max(100)
  }),
  login: z.object({
    identifier: z.string().min(3), // 可以是email或username
    password: z.string().min(6).max(100)
  }),
  update: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    role: z.enum(["user", "admin", "super_admin"]).optional(),
    status: z.enum(["active", "inactive", "suspended"]).optional(),
    profile: z.object({
      avatar: z.string().url().optional(),
      bio: z.string().max(500).optional(),
      website: z.string().url().optional(),
      location: z.string().max(100).optional()
    }).optional()
  })
};

/**
 * 文章验证器
 */
export const articleValidators = {
  create: z.object({
    title: z.string().min(3).max(200),
    content: z.string().min(10),
    summary: z.string().optional(),
    coverUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["draft", "published"]).optional(),
    categoryId: z.string().optional()
  }),
  update: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).optional(),
    summary: z.string().optional(),
    coverUrl: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["draft", "published"]).optional(),
    categoryId: z.string().optional()
  })
};

/**
 * 分类验证器
 */
export const categoryValidators = {
  create: z.object({
    name: z.string().min(2).max(50)
  }),
  update: z.object({
    name: z.string().min(2).max(50)
  })
};

/**
 * 评论验证器
 */
export const commentValidators = {
  create: z.object({
    content: z.string().min(1).max(1000),
    articleId: z.string(),
    replyTo: z.string().optional()
  })
};
