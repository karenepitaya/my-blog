import mongoose, { Schema, Document } from "mongoose";

export interface IFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  articleId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema: Schema<IFavorite> = new Schema(
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

// 一个用户对同一文章只能收藏一次
FavoriteSchema.index({ userId: 1, articleId: 1 }, { unique: true });

export default mongoose.model<IFavorite>("Favorite", FavoriteSchema);

