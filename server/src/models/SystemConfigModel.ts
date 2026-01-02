import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const SystemConfigSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'system',
    },
    admin: {
      type: Schema.Types.Mixed,
      required: true,
    },
    frontend: {
      type: Schema.Types.Mixed,
      required: true,
    },
    oss: {
      type: Schema.Types.Mixed,
      required: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type SystemConfigDocument = HydratedDocument<InferSchemaType<typeof SystemConfigSchema>>;
export const SystemConfigModel = model<InferSchemaType<typeof SystemConfigSchema>>(
  'SystemConfig',
  SystemConfigSchema
);
