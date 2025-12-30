import { Types } from 'mongoose';
import { CategoryModel, CategoryDocument } from '../models/CategoryModel';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';

export const CategoryRepository = {
  async create(data: {
    ownerId: string;
    name: string;
    slug: string;
    description?: string | null;
    status: CategoryStatus;
  }): Promise<CategoryDocument> {
    const category = new CategoryModel({
      ownerId: new Types.ObjectId(data.ownerId),
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      status: data.status,
    });
    return category.save();
  },

  async findById(id: string): Promise<CategoryDocument | null> {
    return CategoryModel.findById(id).exec();
  },

  async findByIdForOwner(id: string, ownerId: string): Promise<CategoryDocument | null> {
    return CategoryModel.findOne({ _id: id, ownerId: new Types.ObjectId(ownerId) }).exec();
  },

  async findBySlugForOwner(ownerId: string, slug: string): Promise<CategoryDocument | null> {
    return CategoryModel.findOne({ ownerId: new Types.ObjectId(ownerId), slug }).exec();
  },

  async findManyByIds(ids: string[]): Promise<CategoryDocument[]> {
    if (ids.length === 0) return [];
    const objectIds = ids.map(id => new Types.ObjectId(id));
    return CategoryModel.find({ _id: { $in: objectIds } }).exec();
  },

  async listForOwner(ownerId: string, options: { status: CategoryStatus }): Promise<CategoryDocument[]> {
    return CategoryModel.find({ ownerId: new Types.ObjectId(ownerId), status: options.status })
      .sort({ createdAt: -1 })
      .exec();
  },

  async list(
    filter: Record<string, unknown>,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<CategoryDocument[]> {
    const query = CategoryModel.find(filter);
    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === 'number') query.skip(options.skip);
    if (typeof options.limit === 'number') query.limit(options.limit);
    return query.exec();
  },

  async count(filter: Record<string, unknown>): Promise<number> {
    return CategoryModel.countDocuments(filter).exec();
  },

  async updateById(id: string, update: Record<string, unknown>): Promise<CategoryDocument | null> {
    return CategoryModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  },

  async updateForOwner(
    id: string,
    ownerId: string,
    update: Record<string, unknown>
  ): Promise<CategoryDocument | null> {
    return CategoryModel.findOneAndUpdate(
      { _id: id, ownerId: new Types.ObjectId(ownerId) },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async deleteHardById(id: string): Promise<CategoryDocument | null> {
    return CategoryModel.findByIdAndDelete(id).exec();
  },

  async findIdsByOwnerIds(ownerIds: string[]): Promise<string[]> {
    if (ownerIds.length === 0) return [];

    const ownerObjectIds = ownerIds.map(id => new Types.ObjectId(id));
    const ids = await CategoryModel.find({ ownerId: { $in: ownerObjectIds } })
      .select({ _id: 1 })
      .lean()
      .exec();

    return ids.map(item => String(item._id));
  },

  async deleteHardByOwnerIds(ownerIds: string[]): Promise<number> {
    if (ownerIds.length === 0) return 0;
    const ownerObjectIds = ownerIds.map(id => new Types.ObjectId(id));
    const result = await CategoryModel.deleteMany({ ownerId: { $in: ownerObjectIds } }).exec();
    return result.deletedCount ?? 0;
  },

  async softDeleteByOwnerIds(input: {
    ownerIds: string[];
    deletedByRole: 'admin' | 'author';
    deletedBy?: string | null;
    deleteScheduledAt?: Date | null;
  }): Promise<number> {
    if (input.ownerIds.length === 0) return 0;

    const ownerObjectIds = input.ownerIds.map(id => new Types.ObjectId(id));
    const now = new Date();
    const deletedBy = input.deletedBy ? new Types.ObjectId(input.deletedBy) : null;

    const result = await CategoryModel.updateMany(
      { ownerId: { $in: ownerObjectIds }, status: CategoryStatuses.ACTIVE },
      {
        status: CategoryStatuses.PENDING_DELETE,
        deletedAt: now,
        deletedByRole: input.deletedByRole,
        deletedBy,
        deleteScheduledAt: input.deleteScheduledAt ?? null,
      }
    ).exec();

    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async transferDeletedByOwnerIds(input: {
    ownerIds: string[];
    deletedBy: string;
    deleteScheduledAt?: Date | null;
  }): Promise<number> {
    if (input.ownerIds.length === 0) return 0;

    const ownerObjectIds = input.ownerIds.map(id => new Types.ObjectId(id));
    const deletedBy = new Types.ObjectId(input.deletedBy);

    const result = await CategoryModel.updateMany(
      {
        ownerId: { $in: ownerObjectIds },
        status: CategoryStatuses.PENDING_DELETE,
        deletedByRole: 'admin',
        deletedBy: null,
      },
      {
        deletedByRole: 'author',
        deletedBy,
        deleteScheduledAt: input.deleteScheduledAt ?? null,
      }
    ).exec();

    return (result as any).modifiedCount ?? (result as any).nModified ?? 0;
  },

  async findActiveIdsByOwnerIds(ownerIds: string[]): Promise<string[]> {
    if (ownerIds.length === 0) return [];

    const ownerObjectIds = ownerIds.map(id => new Types.ObjectId(id));
    const ids = await CategoryModel.find({ ownerId: { $in: ownerObjectIds }, status: CategoryStatuses.ACTIVE })
      .select({ _id: 1 })
      .lean()
      .exec();

    return ids.map(item => String(item._id));
  },

  async isNameExists(input: { ownerId: string; name: string; excludeId?: string }): Promise<boolean> {
    const query: Record<string, unknown> = {
      ownerId: new Types.ObjectId(input.ownerId),
      name: input.name,
    };
    if (input.excludeId) query._id = { $ne: new Types.ObjectId(input.excludeId) };
    const exists = await CategoryModel.exists(query);
    return exists !== null;
  },

  async isSlugExists(input: { ownerId: string; slug: string; excludeId?: string }): Promise<boolean> {
    const query: Record<string, unknown> = {
      ownerId: new Types.ObjectId(input.ownerId),
      slug: input.slug,
    };
    if (input.excludeId) query._id = { $ne: new Types.ObjectId(input.excludeId) };
    const exists = await CategoryModel.exists(query);
    return exists !== null;
  },
};
