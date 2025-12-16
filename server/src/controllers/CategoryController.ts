import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/CategoryService';

type CreateCategoryBody = {
  name: string;
  slug?: string;
  description?: string | null;
};

type UpdateCategoryBody = Partial<CreateCategoryBody>;

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * 获取所有分类
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.categoryService.getAllCategories();
      return res.success(categories);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 根据 ID 获取分类
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);
      return res.success(category);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 创建分类
   */
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as CreateCategoryBody;
      const category = await this.categoryService.createCategory(body);
      return res.success(category, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新分类
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const body = req.body as UpdateCategoryBody;
      const category = await this.categoryService.updateCategory(id, body);
      return res.success(category);
    } catch (error) {
      next(error);
    }
  };

  /**
   * 删除分类
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.deleteCategory(id);
      return res.success(category);
    } catch (error) {
      next(error);
    }
  };
}
