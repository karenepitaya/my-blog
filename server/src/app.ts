import express from "express";
import { connectDB } from "./config/database";

connectDB();

const app = express();

// 让 Express 能够解析 JSON 请求体
app.use(express.json());

import userRoutes from "./routes/userRoutes";
app.use("/api/users", userRoutes);

import articleRoutes from "./routes/articleRoutes";
app.use("/api/articles", articleRoutes);

import categoryRoutes from "./routes/categoryRoutes";
app.use("/api/categories", categoryRoutes);

// 测试路由
app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;

