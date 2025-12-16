import { CategoryRepository } from '../repositories/CategoryRepository';
import { Types } from 'mongoose';
import { createSlug } from '../utils/slug';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * 创建分类
   */
  async createCategory(categoryData: {
    name: string;
    slug?: string;
    description?: string | null;
  }) {
    // 检查名称是否已存在
    const existingName = await this.categoryRepository.isNameExists(categoryData.name);
    if (existingName) {
      throw { status: 409, code: 'DUPLICATE_NAME', message: '分类名称已存在' };
    }

    // 生成或验证 slug
    let slug = categoryData.slug;
    if (!slug) {
      slug = createSlug(categoryData.name);
      if (!slug) {
        throw { status: 400, code: 'SLUG_REQUIRED', message: '无法从分类名称生成 slug，请手动提供 slug' };
      }
    } else {
      slug = createSlug(slug);
      if (!slug) {
        throw { status: 400, code: 'INVALID_SLUG', message: '分类标识无效，请提供有效的 slug' };
      }
    }

    // 检查 slug 是否已存在
    let finalSlug = slug;
    let slugCounter = 1;
    while (await this.categoryRepository.isSlugExists(finalSlug)) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    const category = await this.categoryRepository.create({
      name: categoryData.name,
      slug: finalSlug,
      description: categoryData.description || null
    });

    return category;
  }

  /**
   * 根据 ID 获取分类
   */
  async getCategoryById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: '无效的分类ID' };
    }

    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: '分类不存在' };
    }

    return category;
  }

  /**
   * 根据 slug 获取分类
   */
  async getCategoryBySlug(slug: string) {
    if (!slug) {
      throw { status: 400, code: 'SLUG_REQUIRED', message: '分类标识是必需的' };
    }

    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: '分类不存在' };
    }

    return category;
  }

  /**
   * 获取所有分类
   */
  async getAllCategories() {
    return this.categoryRepository.findAll();
  }

  /**
   * 更新分类
   */
  async updateCategory(
    id: string,
    updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
    }
  ) {
    // 验证 ID
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: '无效的分类ID' };
    }

    // 检查分类是否存在
    const existingCategory = await this.categoryRepository.findById(id);
    if (!existingCategory) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: '分类不存在' };
    }

    // 如果更新名称，检查是否重复
    if (updateData.name !== undefined && updateData.name !== existingCategory.name) {
      const nameExists = await this.categoryRepository.isNameExists(
        updateData.name,
        id
      );
      if (nameExists) {
        throw { status: 409, code: 'DUPLICATE_NAME', message: '分类名称已存在' };
      }
    }

    // 处理 slug 更新
    if (updateData.slug !== undefined) {
      const newSlug = createSlug(updateData.slug);
      if (!newSlug) {
        throw { status: 400, code: 'INVALID_SLUG', message: '分类标识无效，请提供有效的 slug' };
      }

      // 如果 slug 改变，检查是否重复
      if (newSlug !== existingCategory.slug) {
        const slugExists = await this.categoryRepository.isSlugExists(
          newSlug,
          id
        );
        if (slugExists) {
          throw { status: 409, code: 'DUPLICATE_SLUG', message: '分类标识已存在' };
        }
        updateData.slug = newSlug;
      }
    } else if (updateData.name !== undefined && updateData.name !== existingCategory.name) {
      // 如果名称改变但没有提供新 slug，自动生成新 slug
      const newSlug = createSlug(updateData.name);
      if (newSlug && newSlug !== existingCategory.slug) {
        const slugExists = await this.categoryRepository.isSlugExists(
          newSlug,
          id
        );
        if (!slugExists) {
          updateData.slug = newSlug;
        }
      }
    }

    const updatedCategory = await this.categoryRepository.update(id, updateData);
    if (!updatedCategory) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: '分类不存在' };
    }
    return updatedCategory;
  }

  /**
   * 删除分类
   */
  async deleteCategory(id: string) {
    // 验证 ID
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: '无效的分类ID' };
    }

    // 检查分类是否存在
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: '分类不存在' };
    }

    // TODO: 检查是否有关联的文章
    // 如果有文章使用此分类，应该禁止删除或提供迁移选项

    await this.categoryRepository.delete(id);
    return category;
  }

  /**
   * 检查分类是否存在
   */
  async categoryExists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const category = await this.categoryRepository.findById(id);
    return !!category;
  }
}
