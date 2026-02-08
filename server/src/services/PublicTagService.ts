import { Types } from 'mongoose';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { TagRepository } from '../repositories/TagRepository';
import { ArticleStatuses } from '../interfaces/Article';
import { getActiveAuthorIdsCached } from './PublicAuthorVisibility';
import { escapeRegex } from '../utils/regex';
import type { TagDocument } from '../models/TagModel';

function toDto(tag: TagDocument, articleCount: number) {
  return {
    id: String(tag._id),
    name: tag.name,
    slug: tag.slug,
    articleCount,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

export const PublicTagService = {
  async list(input: { page: number; pageSize: number; q?: string }) {
    const page = Math.max(1, Math.floor(input.page));
    const pageSize = Math.max(1, Math.min(200, Math.floor(input.pageSize)));
    const skip = (page - 1) * pageSize;

    const authorIds = await getActiveAuthorIdsCached();
    if (authorIds.length === 0) return { items: [], total: 0, page, pageSize };

    const q = input.q?.trim();

    let candidateSlugs: string[] | undefined;
    if (q) {
      const filter: Record<string, unknown> = {
        $or: [
          { name: { $regex: escapeRegex(q), $options: 'i' } },
          { slug: { $regex: escapeRegex(q), $options: 'i' } },
        ],
      };

      const candidates = await TagRepository.list(filter, { skip: 0, limit: 1000, sort: { name: 1 } });
      candidateSlugs = candidates.map(tag => tag.slug);
      if (candidateSlugs.length === 0) return { items: [], total: 0, page, pageSize };
    }

    const { items: tagCounts, total } = await ArticleRepository.listPublishedTagCounts(
      candidateSlugs
        ? { authorIds, tagSlugs: candidateSlugs, skip, limit: pageSize }
        : { authorIds, skip, limit: pageSize }
    );

    if (tagCounts.length === 0) return { items: [], total, page, pageSize };

    const tags = await TagRepository.findManyBySlugs(tagCounts.map(item => item.slug));
    const tagBySlug = new Map(tags.map(tag => [tag.slug, tag]));

    const items = tagCounts
      .map(item => {
        const tag = tagBySlug.get(item.slug);
        if (!tag) return null;
        return toDto(tag, item.count);
      })
      .filter(Boolean);

    return { items, total, page, pageSize };
  },

  async detailBySlug(input: { slug: string }) {
    const slug = String(input.slug ?? '').trim().toLowerCase();
    if (!slug) throw { status: 400, code: 'SLUG_REQUIRED', message: 'Slug is required' };

    const tag = await TagRepository.findBySlug(slug);
    if (!tag) throw { status: 404, code: 'TAG_NOT_FOUND', message: 'Tag not found' };

    const authorIds = await getActiveAuthorIdsCached();
    const authorObjectIds = authorIds.map(id => new Types.ObjectId(id));

    const articleCount =
      authorObjectIds.length === 0
        ? 0
        : await ArticleRepository.count({
            status: ArticleStatuses.PUBLISHED,
            authorId: { $in: authorObjectIds },
            tags: slug,
          });

    return toDto(tag, articleCount);
  },
};
