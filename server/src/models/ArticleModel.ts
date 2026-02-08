import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ArticleStatuses } from '../interfaces/Article';

const ArticleSchema = new Schema(
  {
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'authorId is required'],
      index: true,
    },

    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [200, 'title must be at most 200 characters'],
    },

    slug: {
      type: String,
      required: [true, 'slug is required'],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },

    summary: {
      type: String,
      maxlength: [500, 'summary must be at most 500 characters'],
      default: null,
    },

    coverImageUrl: {
      type: String,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(ArticleStatuses),
      default: ArticleStatuses.DRAFT,
      index: true,
    },
    preDeleteStatus: {
      type: String,
      enum: Object.values(ArticleStatuses),
      default: null,
    },

    firstPublishedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null, index: true },

    views: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },

    deletedAt: { type: Date, default: null },
    deletedByRole: { type: String, enum: ['admin', 'author'], default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deleteScheduledAt: { type: Date, default: null, index: true },
    deleteReason: { type: String, maxlength: [500, 'deleteReason must be at most 500 characters'], default: null },

    restoreRequestedAt: { type: Date, default: null, index: true },
    restoreRequestedMessage: {
      type: String,
      maxlength: [500, 'restoreRequestedMessage must be at most 500 characters'],
      default: null,
    },

    adminRemark: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// CONTRACT: Slugs are unique per author; different authors may reuse.
ArticleSchema.index({ authorId: 1, slug: 1 }, { unique: true });

ArticleSchema.index({ authorId: 1, status: 1, updatedAt: -1 });
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, deleteScheduledAt: 1 });

// CONTRACT: Articles start as DRAFT and can only publish via publish/restore flows.
ArticleSchema.pre('validate', function (next) {
  if (this.isNew && this.status !== ArticleStatuses.DRAFT) {
    return next(new Error('NEW_ARTICLE_MUST_START_AS_DRAFT'));
  }
  next();
});

export type ArticleDocument = HydratedDocument<InferSchemaType<typeof ArticleSchema>>;
export const ArticleModel = model<InferSchemaType<typeof ArticleSchema>>('Article', ArticleSchema);
