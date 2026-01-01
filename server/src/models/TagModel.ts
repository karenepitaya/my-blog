import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const TagSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: [50, 'Tag name must be at most 50 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Tag slug is required'],
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
    },
    color: {
      type: String,
      trim: true,
      maxlength: [20, 'Tag color must be at most 20 characters'],
      default: null,
    },
    effect: {
      type: String,
      enum: ['glow', 'pulse', 'none'],
      default: 'none',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Tag description must be at most 500 characters'],
      default: null,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TagSchema.index({ slug: 1 }, { unique: true });
TagSchema.index({ name: 1 });

export type TagDocument = HydratedDocument<InferSchemaType<typeof TagSchema>>;
export const TagModel = model<InferSchemaType<typeof TagSchema>>('Tag', TagSchema);
