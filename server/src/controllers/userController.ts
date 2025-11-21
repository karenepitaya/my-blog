import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

// ==========================
// 创建管理员账号
// ==========================
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password are required" });
    }

    // 单用户博客：只允许存在 1 个用户
    const userCount = await User.countDocuments();

    if (userCount >= 1) {
      return res.status(403).json({ error: "Registration is disabled" });
    }

    // 不能重复 username 或 email
    const exists = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (exists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // 哈希密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      username,
      email,
      passwordHash,
      role: "admin",   // 单用户博客固定角色
    });

    return res.json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};


// ==========================
// 登录（使用 email 或 username）
// ==========================
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "identifier (email or username) and password are required" });
    }

    // identifier 可以是 email 或 username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // 签发 JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
};


// ==========================
// 获取当前用户信息（需要 JWT）
// ==========================
export const getMe = async (req: Request, res: Response) => {
  try {
    const user = await User.findById((req as any).user.id).select(
      "_id username email role createdAt updatedAt"
    );

    return res.json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
};
