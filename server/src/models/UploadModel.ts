import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const UploadSchema = new Schema(
  {
    url: { type: String, required: [true, 'url is required'] },

    storage: {
      type: String,
      enum: ['local', 'oss', 'minio'],
      default: 'local',
    },

    storageKey: {
      type: String,
      required: [true, 'storageKey is required'],
      trim: true,
      index: true,
      unique: true,
    },

    fileName: {
      type: String,
      required: [true, 'fileName is required'],
      trim: true,
      maxlength: [255, 'fileName must be at most 255 characters'],
    },

    mimeType: {
      type: String,
      required: [true, 'mimeType is required'],
      trim: true,
    },

    size: {
      type: Number,
      required: [true, 'size is required'],
      min: [0, 'size must be non-negative'],
    },

    purpose: {
      type: String,
      enum: ['avatar', 'article_cover', 'category_cover', 'favicon', 'ui_icon', 'audio', 'video', 'misc'],
      default: 'misc',
      index: true,
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy is required'],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type UploadDocument = HydratedDocument<InferSchemaType<typeof UploadSchema>>;
export const UploadModel = model<InferSchemaType<typeof UploadSchema>>('Upload', UploadSchema);
