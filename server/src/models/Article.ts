import mongoose, { Schema, Document } from "mongoose";

export interface IArticle extends Document {
  title: string;
  content: string;
  summary?: string;
  coverUrl?: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  category?: mongoose.Types.ObjectId;
  status: "draft" | "published";
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema<IArticle> = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true }, // Markdown 文本
    summary: { type: String },
    coverUrl: { type: String },
    tags: { type: [String], default: [] },

    // 关联用户
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true, // 作者必须存在（防止孤儿文章）
    },

    // 关联分类（可选）
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },

    // 关联文章状态管理
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // 文章 slug（SEO 友好）
    slug: { type: String, unique: true, required: true },

    // 浏览量统计
    views: { type: Number, default: 0 },
  },
  {
    timestamps: true, // 自动生成 createdAt / updatedAt
    versionKey: false,
    }
);

export default mongoose.model<IArticle>("Article", ArticleSchema);
