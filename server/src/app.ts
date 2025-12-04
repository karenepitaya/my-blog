import express, { Request, Response, NextFunction, Express } from "express";
import cors from "cors";
import { connectDB } from "./config/database";

connectDB();

const app: Express = express();

app.use(express.json());

// ==============================
// CORS 设置（前端可访问 API）
// ==============================
app.use(
  cors({
    origin: [
      "http://localhost:5173",                       // 本地开发
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://karenepitaya.xyz",                    // 主站
      "https://blog.karenepitaya.xyz",               // 博客前端（未来）
    ],
    credentials: true,
  })
);

// ==============================
// 路由
// ==============================
import userRoutes from "./routes/userRoutes";
app.use("/api/users", userRoutes);

import articleRoutes from "./routes/articleRoutes";
app.use("/api/articles", articleRoutes);

import categoryRoutes from "./routes/categoryRoutes";
app.use("/api/categories", categoryRoutes);

import commentRoutes from "./routes/commentRoutes";
app.use("/api/comments", commentRoutes);

// 测试路由
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 全局错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
});

export default app;
