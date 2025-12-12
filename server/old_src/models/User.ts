import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: "super_admin" | "admin" | "user";  // 多角色系统
  status: "active" | "inactive" | "suspended";  // 用户状态
  profile?: {
    avatar?: string;
    bio?: string;
    website?: string;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // 存储 bcrypt 哈希，而不是明文密码
    passwordHash: {
      type: String,
      required: true,
    },

    // 角色：多用户系统支持三种角色
    role: {
      type: String,
      enum: ["super_admin", "admin", "user"],
      default: "user",
    },

    // 用户状态
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    // 用户个人资料（可选）
    profile: {
      avatar: { type: String, default: "" },
      bio: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    // 最后登录时间
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model<IUser>("User", UserSchema);

