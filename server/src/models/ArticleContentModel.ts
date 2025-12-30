import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const TocItemSchema = new Schema(
  {
    level: { type: Number, required: true, min: 1, max: 6 },
    text: { type: String, required: true },
    id: { type: String, required: true },
  },
  { _id: false }
);

const ArticleContentSchema = new Schema(
  {
    articleId: {
      type: Schema.Types.ObjectId,
      ref: 'Article',
      required: [true, 'articleId is required'],
      index: true,
      unique: true,
    },

    markdown: {
      type: String,
      required: [true, 'markdown is required'],
    },

    html: { type: String, default: null },
    toc: { type: [TocItemSchema], default: [] },
    renderedAt: { type: Date, default: null },
    renderer: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type ArticleContentDocument = HydratedDocument<InferSchemaType<typeof ArticleContentSchema>>;
export const ArticleContentModel = model<InferSchemaType<typeof ArticleContentSchema>>(
  'ArticleContent',
  ArticleContentSchema
);
