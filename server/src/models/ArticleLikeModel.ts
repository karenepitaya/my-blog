import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const ArticleLikeSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'articleId is required'],
      index: true,
    },

    fingerprint: {
      type: String,
      required: [true, 'fingerprint is required'],
      trim: true,
      minlength: [10, 'fingerprint is too short'],
      maxlength: [200, 'fingerprint is too long'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

ArticleLikeSchema.index({ articleId: 1, fingerprint: 1 }, { unique: true });

export type ArticleLikeDocument = HydratedDocument<InferSchemaType<typeof ArticleLikeSchema>>;
export const ArticleLikeModel = model<InferSchemaType<typeof ArticleLikeSchema>>('ArticleLike', ArticleLikeSchema);

