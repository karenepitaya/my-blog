import { Types } from 'mongoose';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { createSlug } from '../utils/slug';
import { CategoryStatuses, type CategoryStatus } from '../interfaces/Category';

const DEFAULT_DELETE_GRACE_DAYS = 7;

function toDto(category: any) {
  return {
    id: String(category._id),
    ownerId: String(category.ownerId),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    status: category.status,
    deletedAt: category.deletedAt ?? null,
    deletedByRole: category.deletedByRole ?? null,
    deleteScheduledAt: category.deleteScheduledAt ?? null,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export const AuthorCategoryService = {
  async list(input: { userId: string; status?: CategoryStatus }) {
    const status = input.status ?? CategoryStatuses.ACTIVE;
    const items = await CategoryRepository.listForOwner(input.userId, { status });
    return { items: items.map(toDto) };
  },

  async detail(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const category = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!category) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    return toDto(category);
  },

  async create(input: { userId: string; name: string; slug?: string; description?: string | null }) {
    const name = String(input.name ?? '').trim();
    if (!name) throw { status: 400, code: 'NAME_REQUIRED', message: 'Category name is required' };

    const nameExists = await CategoryRepository.isNameExists({ ownerId: input.userId, name });
    if (nameExists) throw { status: 409, code: 'DUPLICATE_NAME', message: 'Category name already exists' };

    let slug = input.slug ? createSlug(String(input.slug)) : createSlug(name);
    if (!slug) throw { status: 400, code: 'INVALID_SLUG', message: 'Invalid slug' };

    let finalSlug = slug;
    let counter = 1;
    while (await CategoryRepository.isSlugExists({ ownerId: input.userId, slug: finalSlug })) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await CategoryRepository.create({
      ownerId: input.userId,
      name,
      slug: finalSlug,
      description: input.description ?? null,
      status: CategoryStatuses.ACTIVE,
    });

    return toDto(category);
  },

  async update(input: { userId: string; id: string; name?: string; slug?: string; description?: string | null }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) {
      throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }

    if (existing.status !== CategoryStatuses.ACTIVE) {
      throw { status: 409, code: 'CATEGORY_NOT_ACTIVE', message: 'Category is not active' };
    }

    const update: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = String(input.name).trim();
      if (!name) throw { status: 400, code: 'INVALID_NAME', message: 'Invalid category name' };
      if (name !== existing.name) {
        const exists = await CategoryRepository.isNameExists({
          ownerId: input.userId,
          name,
          excludeId: input.id,
        });
        if (exists) throw { status: 409, code: 'DUPLICATE_NAME', message: 'Category name already exists' };
        update.name = name;
      }
    }

    if (input.slug !== undefined) {
      const slug = createSlug(String(input.slug));
      if (!slug) throw { status: 400, code: 'INVALID_SLUG', message: 'Invalid slug' };
      if (slug !== existing.slug) {
        const exists = await CategoryRepository.isSlugExists({
          ownerId: input.userId,
          slug,
          excludeId: input.id,
        });
        if (exists) throw { status: 409, code: 'DUPLICATE_SLUG', message: 'Category slug already exists' };
        update.slug = slug;
      }
    }

    if (input.description !== undefined) {
      update.description = input.description === null ? null : String(input.description).trim();
    }

    const updated = await CategoryRepository.updateForOwner(input.id, input.userId, update);
    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    return toDto(updated);
  },

  async remove(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    if (existing.status === CategoryStatuses.PENDING_DELETE) {
      return {
        id: input.id,
        status: existing.status,
        deleteScheduledAt: existing.deleteScheduledAt ?? null,
      };
    }

    const deleteScheduledAt = new Date(Date.now() + DEFAULT_DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000);
    const updated = await CategoryRepository.updateForOwner(input.id, input.userId, {
      status: CategoryStatuses.PENDING_DELETE,
      deletedAt: new Date(),
      deletedByRole: 'author',
      deletedBy: new Types.ObjectId(input.userId),
      deleteScheduledAt,
    });

    if (!updated) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    return {
      id: input.id,
      status: CategoryStatuses.PENDING_DELETE,
      deleteScheduledAt,
    };
  },

  async confirmDelete(input: { userId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid category id' };
    }

    const existing = await CategoryRepository.findByIdForOwner(input.id, input.userId);
    if (!existing) throw { status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };

    if (existing.status !== CategoryStatuses.PENDING_DELETE) {
      throw { status: 409, code: 'NOT_PENDING_DELETE', message: 'Category is not pending deletion' };
    }

    await CategoryRepository.deleteHardById(input.id);
    return { id: input.id, purged: true, purgedAt: new Date().toISOString() };
  },
};

