import { CategoryModel, CategoryDocument } from '../models/CategoryModel';
import { Types } from 'mongoose';

export class CategoryRepository {
  /**
   * 创建分类
   */
  async create(categoryData: {
    name: string;
    slug: string;
    description?: string | null;
  }): Promise<CategoryDocument> {
    const category = new CategoryModel(categoryData);
    return category.save();
  }

  /**
   * 根据 ID 查找分类
   */
  async findById(id: string | Types.ObjectId): Promise<CategoryDocument | null> {
    return CategoryModel.findById(id);
  }

  /**
   * 根据 slug 查找分类
   */
  async findBySlug(slug: string): Promise<CategoryDocument | null> {
    return CategoryModel.findOne({ slug });
  }

  /**
   * 根据名称查找分类
   */
  async findByName(name: string): Promise<CategoryDocument | null> {
    return CategoryModel.findOne({ name });
  }

  /**
   * 获取所有分类
   */
  async findAll(): Promise<CategoryDocument[]> {
    return CategoryModel.find({}).sort({ createdAt: -1 });
  }

  /**
   * 更新分类
   */
  async update(
    id: string | Types.ObjectId,
    updateData: Partial<{
      name: string;
      slug: string;
      description: string | null;
    }>
  ): Promise<CategoryDocument | null> {
    return CategoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  /**
   * 删除分类
   */
  async delete(id: string | Types.ObjectId): Promise<CategoryDocument | null> {
    return CategoryModel.findByIdAndDelete(id);
  }

  /**
   * 检查分类名称是否存在（排除指定ID）
   */
  async isNameExists(
    name: string,
    excludeId?: string | Types.ObjectId
  ): Promise<boolean> {
    const query: Record<string, unknown> = { name };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await CategoryModel.exists(query);
    return exists !== null;
  }

  /**
   * 检查 slug 是否存在（排除指定ID）
   */
  async isSlugExists(
    slug: string,
    excludeId?: string | Types.ObjectId
  ): Promise<boolean> {
    const query: Record<string, unknown> = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await CategoryModel.exists(query);
    return exists !== null;
  }

  /**
   * 获取分类总数
   */
  async count(): Promise<number> {
    return CategoryModel.countDocuments();
  }
}
