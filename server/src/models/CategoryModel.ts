import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const CategorySchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'ownerId is required'],
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [50, 'Category name must be at most 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    description: {
      type: String,
      maxlength: [200, 'Category description must be at most 200 characters'],
      default: null,
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING_DELETE'],
      default: 'ACTIVE',
      index: true,
    },

    deletedAt: { type: Date, default: null },
    deletedByRole: { type: String, enum: ['admin', 'author'], default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    deleteScheduledAt: { type: Date, default: null, index: true },

    adminRemark: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

CategorySchema.index({ ownerId: 1, name: 1 }, { unique: true });
CategorySchema.index({ ownerId: 1, slug: 1 }, { unique: true });

export type CategoryDocument = HydratedDocument<InferSchemaType<typeof CategorySchema>>;

export const CategoryModel = model<InferSchemaType<typeof CategorySchema>>('Category', CategorySchema);

