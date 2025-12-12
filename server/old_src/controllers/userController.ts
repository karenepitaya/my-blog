import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

// ==========================
// 注册用户（支持多用户系统）
// ==========================
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role = "user" } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "username, email, password are required" });
    }

    // 检查系统中是否还没有任何用户（初始化阶段）
    const totalUsers = await User.countDocuments();
    
    let assignedRole = role;
    
    if (totalUsers === 0) {
      // 第一个注册用户自动成为超级管理员
      assignedRole = "super_admin";
    } else {
      // 后续注册需要权限控制
      // 只有超级管理员可以创建管理员，普通用户只能注册普通用户
      const requestingUser = (req as any).user;
      
      if (requestingUser) {
        // 已登录用户的注册请求
        if (requestingUser.role !== "super_admin" && role !== "user") {
          return res.status(403).json({ error: "Insufficient permissions to create users with this role" });
        }
      } else {
        // 未登录用户的自助注册，只能是普通用户
        if (role !== "user") {
          assignedRole = "user";
        }
      }
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
      role: assignedRole,
      status: "active",
    });

    return res.json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        isInitialAdmin: assignedRole === "super_admin" && totalUsers === 0,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// ==========================
// 登录用户（使用 email 或 username）
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
      status: "active", // 只允许活跃用户登录
    });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    // 更新最后登录时间
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // 签发 JWT
    const jwtSecret = process.env.JWT_SECRET || "default-secret-key"; // 添加默认值
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      jwtSecret,
      { expiresIn: "7d" } // 简化为固定值
    );

    res.json({
      message: "Login success",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: new Date(),
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
      "_id username email role status profile lastLoginAt createdAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Failed to get user info" });
  }
};

// ==========================
// 获取用户列表（管理员功能）
// ==========================
export const getUsers = async (req: Request, res: Response) => {
  try {
    // 获取当前用户信息
    const currentUser = (req as any).user;
    
    // 只有管理员和超级管理员可以查看用户列表
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return res.status(403).json({ error: "Access denied - insufficient permissions" });
    }

    // 获取所有用户，排除密码哈希
    const users = await User.find({}, { passwordHash: 0 }).sort({ createdAt: -1 });

    return res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      })),
      total: users.length,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
};

// ==========================
// 更新用户信息（管理员功能）
// ==========================
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, role, status, profile } = req.body;
    const currentUser = (req as any).user;

    // 权限检查
    if (currentUser.role !== "admin" && currentUser.role !== "super_admin") {
      return res.status(403).json({ error: "Access denied - insufficient permissions" });
    }

    // 超级管理员可以修改任何用户，管理员只能修改普通用户
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 管理员不能修改超级管理员或其他管理员
    if (currentUser.role === "admin") {
      if (targetUser.role === "super_admin" || targetUser.role === "admin") {
        return res.status(403).json({ error: "Cannot modify users with equal or higher privileges" });
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role && currentUser.role === "super_admin") {
      // 只有超级管理员可以修改角色
      updateData.role = role;
    }
    if (status) updateData.status = status;
    if (profile) {
      updateData.profile = { ...targetUser.profile, ...profile };
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: "-passwordHash" }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found after update" });
    }

    return res.json({
      message: "User updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profile: updatedUser.profile,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
};

// ==========================
// 删除用户（超级管理员功能）
// ==========================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // 只有超级管理员可以删除用户
    if (currentUser.role !== "super_admin") {
      return res.status(403).json({ error: "Access denied - super admin only" });
    }

    // 不能删除自己
    if (id === currentUser.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 硬删除用户
    await User.findByIdAndDelete(id);

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ error: "Failed to delete user" });
  }
};

// ==========================
// 更新个人资料（用户更新自己的信息）
// ==========================
export const updateOwnProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { username, email, profile } = req.body;

    // 获取当前用户
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // 检查用户名是否已存在（排除当前用户）
    if (username && username !== currentUser.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    // 检查邮箱是否已存在（排除当前用户）
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // 构建更新数据
    const updateData: any = {};
    if (username && username !== currentUser.username) updateData.username = username;
    if (email && email !== currentUser.email) updateData.email = email;
    if (profile) {
      updateData.profile = { ...currentUser.profile, ...profile };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: "-passwordHash" }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found after update" });
    }

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        profile: updatedUser.profile,
        lastLoginAt: updatedUser.lastLoginAt,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

// ==========================
// 修改密码（用户更新自己的密码）
// ==========================
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }

    // 获取当前用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: "New password cannot be the same as current password" });
    }

    // 哈希新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash
    });

    return res.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ error: "Failed to change password" });
  }
};

// ==========================
// 注销当前用户（软删除）
// ==========================
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // 获取用户信息
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 安全验证：要求用户重新输入密码确认
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password confirmation is required for deactivation" });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password confirmation" });
    }

    // 软删除：更新用户状态而不是真正删除
    // 将用户名和邮箱标记为已注销，保留数据完整性
    const deactivatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username: `[deactivated]${user.username}_${Date.now()}`,
        email: `[deactivated]${user.email}_${Date.now()}`,
        status: "inactive",
      },
      { new: true }
    );

    // 重要安全提示
    console.log(`User ${user.username} has been deactivated. System needs re-registration.`);

    res.json({
      message: "User account has been deactivated successfully. You can now register a new admin account.",
      deactivated: {
        id: deactivatedUser?._id,
        username: deactivatedUser?.username,
        deactivatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ error: "Failed to deactivate user account" });
  }
};
