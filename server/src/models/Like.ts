import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
  userId: mongoose.Types.ObjectId;
  articleId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema: Schema<ILike> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// 一个用户对一篇文章只能点赞一次
LikeSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.model<ILike>("Like", LikeSchema);

