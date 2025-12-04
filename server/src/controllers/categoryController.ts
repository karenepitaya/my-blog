import { Request, Response } from "express";
import Category from "../models/Category";
import { createSlug } from "../utils/slug";

// 创建分类
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    const rawSlug = createSlug(name);
    let slug = rawSlug;

    const exists = await Category.findOne({ slug });
    if (exists) {
      slug = `${rawSlug}-${Date.now().toString(36)}`;
    }

    const category = await Category.create({ name, slug });

    res.json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// 列表（支持可选按 categoryId 过滤）
export const listCategories = async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.query;

    const filter: any = {};
    if (categoryId) {
      filter._id = categoryId;
    }

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    res.json(categories);
  } catch (error) {
    console.error("List categories error:", error);
    res.status(500).json({ error: "Failed to list categories" });
  }
};

// 更新分类
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    // 生成新的slug
    const rawSlug = createSlug(name);
    let slug = rawSlug;

    // 检查新slug是否已存在（排除当前分类）
    const existing = await Category.findOne({ 
      slug: rawSlug, 
      _id: { $ne: id } 
    });
    if (existing) {
      slug = `${rawSlug}-${Date.now().toString(36)}`;
    }

    const updated = await Category.findByIdAndUpdate(
      id, 
      { name, slug }, 
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// 删除分类
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Category.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category deleted successfully",
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};
