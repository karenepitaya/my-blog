import { Types } from 'mongoose';
import { TagRepository } from '../repositories/TagRepository';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { createSlug } from '../utils/slug';
import { escapeRegex } from '../utils/regex';
import type { TagDocument } from '../models/TagModel';

type ErrorWithCode = { code?: number };

const getErrorCode = (err: unknown): number | undefined => {
  if (!err || typeof err !== 'object') return undefined;
  return (err as ErrorWithCode).code;
};

function toDto(tag: TagDocument) {
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
  };
}

export type TagInput = { name: string; slug: string };

export const AuthorTagService = {
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
      TagRepository.list(filter, { skip, limit: pageSize, sort: { name: 1 } }),
    ]);

    return { items: items.map(toDto), total, page, pageSize };
  },

  async create(input: {
    userId: string;
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
    if (existing) return toDto(existing);

    try {
      const created = await TagRepository.create({
        name,
        slug,
        createdBy: input.userId,
        color: color ? color : null,
        effect: input.effect ?? 'none',
        description: description ? description : null,
      });
      return toDto(created);
    } catch (err) {
      if (getErrorCode(err) !== 11000) throw err;
      const winner = await TagRepository.findBySlug(slug);
      if (!winner) throw err;
      return toDto(winner);
    }
  },

  async update(input: {
    userId: string;
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
      return toDto(tag);
    }

    const updated = await TagRepository.updateById(input.id, update);
    if (!updated) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    if (nextSlug && nextSlug !== tag.slug) {
      await ArticleRepository.replaceTagSlug(tag.slug, nextSlug);
    }

    return toDto(updated);
  },

  async delete(input: { userId: string; id: string }) {
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

  /**
   * Ensure a batch of tags exist in the global tag library.
   *
   * This is used by Article create/update so that authors can "type to create"
   * without a separate tag creation flow.
   */
  async ensureTagsExist(input: { userId: string; tags: TagInput[] }): Promise<void> {
    const unique = new Map<string, string>();
    for (const tag of input.tags) {
      const name = String(tag.name ?? '').trim();
      const slug = String(tag.slug ?? '').trim().toLowerCase();
      if (!name || !slug) continue;
      if (!unique.has(slug)) unique.set(slug, name);
    }

    const slugs = Array.from(unique.keys());
    if (slugs.length === 0) return;

    const existing = await TagRepository.findManyBySlugs(slugs);
    const existingSlugs = new Set(existing.map(t => t.slug));

    const missing = slugs
      .filter(slug => !existingSlugs.has(slug))
      .map(slug => ({ name: unique.get(slug) ?? slug, slug, createdBy: input.userId }));

    await TagRepository.insertManyIgnoreDuplicates(missing);
  },
};
