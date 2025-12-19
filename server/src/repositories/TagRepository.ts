import { Types } from 'mongoose';
import { TagModel, type TagDocument } from '../models/TagModel';

export const TagRepository = {
  async create(data: { name: string; slug: string; createdBy: string }): Promise<TagDocument> {
    const tag = new TagModel({
      name: data.name,
      slug: data.slug,
      createdBy: new Types.ObjectId(data.createdBy),
    });
    return tag.save();
  },

  async findById(id: string): Promise<TagDocument | null> {
    return TagModel.findById(id).exec();
  },

  async findBySlug(slug: string): Promise<TagDocument | null> {
    return TagModel.findOne({ slug }).exec();
  },

  async findManyBySlugs(slugs: string[]): Promise<TagDocument[]> {
    if (slugs.length === 0) return [];
    return TagModel.find({ slug: { $in: slugs } }).exec();
  },

  async list(
    filter: Record<string, unknown>,
    options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> }
  ): Promise<TagDocument[]> {
    const query = TagModel.find(filter);
    if (options.sort) query.sort(options.sort);
    if (typeof options.skip === 'number') query.skip(options.skip);
    if (typeof options.limit === 'number') query.limit(options.limit);
    return query.exec();
  },

  async count(filter: Record<string, unknown>): Promise<number> {
    return TagModel.countDocuments(filter).exec();
  },

  async deleteById(id: string): Promise<TagDocument | null> {
    return TagModel.findByIdAndDelete(id).exec();
  },

  async insertManyIgnoreDuplicates(data: Array<{ name: string; slug: string; createdBy: string }>): Promise<void> {
    if (data.length === 0) return;

    const docs = data.map(item => ({
      name: item.name,
      slug: item.slug,
      createdBy: new Types.ObjectId(item.createdBy),
    }));

    try {
      await TagModel.insertMany(docs, { ordered: false });
    } catch (err: any) {
      // Duplicate key errors are expected in concurrent creation scenarios.
      if (err?.code !== 11000) throw err;
    }
  },
};
