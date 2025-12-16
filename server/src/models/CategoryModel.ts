import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, '分类名称是必需的'],
      unique: true,
      trim: true,
      maxlength: [50, '分类名称不能超过50个字符']
    },
    slug: {
      type: String,
      required: [true, '分类标识是必需的'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, '分类标识只能包含小写字母、数字和短横线']
    },
    description: {
      type: String,
      maxlength: [200, '分类描述不能超过200个字符'],
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type CategoryDocument = HydratedDocument<InferSchemaType<typeof CategorySchema>>;

export const CategoryModel = model<InferSchemaType<typeof CategorySchema>>('Category', CategorySchema);
