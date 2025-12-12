import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  replyTo?: mongoose.Types.ObjectId | null;
  createdAt: Date;
}

const CommentSchema: Schema<IComment> = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: "Article",
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    // 二级评论：回复某条评论
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export default mongoose.model<IComment>("Comment", CommentSchema);

