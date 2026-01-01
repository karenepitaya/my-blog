import { Types } from 'mongoose';
import { TagRepository } from '../repositories/TagRepository';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { createSlug } from '../utils/slug';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAdminDto(tag: any) {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
    color: tag.color ?? null,
    effect: tag.effect ?? 'none',
    description: tag.description ?? null,
    createdBy: tag.createdBy ? String(tag.createdBy) : null,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
    articleCount: 0,
  };
}

export const AdminTagService = {
  async list(input: { page: number; pageSize: number; q?: string }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(200, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {};
    if (input.q && input.q.trim()) {
      const q = input.q.trim();
      filter.$or = [
        { name: { $regex: escapeRegex(q), $options: 'i' } },
        { slug: { $regex: escapeRegex(q), $options: 'i' } },
      ];
    }

    const [total, items] = await Promise.all([
      TagRepository.count(filter),
      TagRepository.list(filter, { skip, limit: pageSize, sort: { createdAt: -1 } }),
    ]);

    return { items: items.map(toAdminDto), total, page, pageSize };
  },

  async detail(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid tag id' };
    }

    const tag = await TagRepository.findById(id);
    if (!tag) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };
    return toAdminDto(tag);
  },

  async create(input: {
    actorId: string;
    name: string;
    color?: string | null;
    effect?: 'glow' | 'pulse' | 'none';
    description?: string | null;
  }) {
    const name = String(input.name ?? '').trim();
    if (!name) throw { status: 400, code: 'NAME_REQUIRED', message: 'Tag name is required' };

    const slug = createSlug(name);
    if (!slug) throw { status: 400, code: 'INVALID_NAME', message: 'Invalid tag name' };

    const color = String(input.color ?? '').trim();
    const description = String(input.description ?? '').trim();

    const existing = await TagRepository.findBySlug(slug);
    if (existing) return toAdminDto(existing);

    try {
      const created = await TagRepository.create({
        name,
        slug,
        createdBy: input.actorId,
        color: color ? color : null,
        effect: input.effect ?? 'none',
        description: description ? description : null,
      });
      return toAdminDto(created);
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
      const winner = await TagRepository.findBySlug(slug);
      if (!winner) throw err;
      return toAdminDto(winner);
    }
  },

  async update(input: {
    actorId: string;
    id: string;
    name?: string;
    color?: string | null;
    effect?: 'glow' | 'pulse' | 'none';
    description?: string | null;
  }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid tag id' };
    }

    const tag = await TagRepository.findById(input.id);
    if (!tag) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    const update: Record<string, unknown> = {};
    let nextSlug: string | null = null;

    if (input.name !== undefined) {
      const nextName = String(input.name ?? '').trim();
      if (!nextName) throw { status: 400, code: 'NAME_REQUIRED', message: 'Tag name is required' };

      const slug = createSlug(nextName);
      if (!slug) throw { status: 400, code: 'INVALID_NAME', message: 'Invalid tag name' };

      if (slug !== tag.slug) {
        const existing = await TagRepository.findBySlug(slug);
        if (existing && String(existing._id) !== String(tag._id)) {
          throw { status: 409, code: 'SLUG_EXISTS', message: 'Tag slug already exists' };
        }
        nextSlug = slug;
        update.slug = slug;
      }

      update.name = nextName;
    }

    if (input.color !== undefined) {
      const color = String(input.color ?? '').trim();
      update.color = color ? color : null;
    }

    if (input.effect !== undefined) {
      update.effect = input.effect;
    }

    if (input.description !== undefined) {
      const description = String(input.description ?? '').trim();
      update.description = description ? description : null;
    }

    if (Object.keys(update).length === 0) {
      return toAdminDto(tag);
    }

    const updated = await TagRepository.updateById(input.id, update);
    if (!updated) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    if (nextSlug && nextSlug !== tag.slug) {
      await ArticleRepository.replaceTagSlug(tag.slug, nextSlug);
    }

    return toAdminDto(updated);
  },

  async delete(input: { actorId: string; id: string }) {
    if (!Types.ObjectId.isValid(input.id)) {
      throw { status: 400, code: 'INVALID_ID', message: 'Invalid tag id' };
    }

    const tag = await TagRepository.findById(input.id);
    if (!tag) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    const deleted = await TagRepository.deleteById(input.id);
    if (!deleted) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    const affectedArticles = await ArticleRepository.removeTagFromAllArticles(tag.slug);

    return {
      id: input.id,
      deleted: true,
      deletedAt: new Date().toISOString(),
      affectedArticles,
    };
  },
};
