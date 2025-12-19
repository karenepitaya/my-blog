import { TagRepository } from '../repositories/TagRepository';
import { createSlug } from '../utils/slug';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toDto(tag: any) {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
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

  async create(input: { userId: string; name: string }) {
    const name = String(input.name ?? '').trim();
    if (!name) throw { status: 400, code: 'NAME_REQUIRED', message: 'Tag name is required' };

    const slug = createSlug(name);
    if (!slug) throw { status: 400, code: 'INVALID_NAME', message: 'Invalid tag name' };

    const existing = await TagRepository.findBySlug(slug);
    if (existing) return toDto(existing);

    try {
      const created = await TagRepository.create({ name, slug, createdBy: input.userId });
      return toDto(created);
    } catch (err: any) {
      if (err?.code !== 11000) throw err;
      const winner = await TagRepository.findBySlug(slug);
      if (!winner) throw err;
      return toDto(winner);
    }
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

