import { Types } from 'mongoose';
import { TagRepository } from '../repositories/TagRepository';
import { ArticleRepository } from '../repositories/ArticleRepository';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toAdminDto(tag: any) {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
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

