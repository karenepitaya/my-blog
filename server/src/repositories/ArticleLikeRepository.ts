import { Types } from 'mongoose';
import { ArticleLikeModel } from '../models/ArticleLikeModel';

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as any).code === 11000);
}

export const ArticleLikeRepository = {
  async existsByArticleAndFingerprint(input: { articleId: string; fingerprint: string }): Promise<boolean> {
    const exists = await ArticleLikeModel.exists({
      articleId: new Types.ObjectId(input.articleId),
      fingerprint: input.fingerprint,
    });
    return exists !== null;
  },

  async createIfNotExists(input: { articleId: string; fingerprint: string }): Promise<{ created: boolean }> {
    try {
      await ArticleLikeModel.create({
        articleId: new Types.ObjectId(input.articleId),
        fingerprint: input.fingerprint,
      });
      return { created: true };
    } catch (err) {
      if (isDuplicateKeyError(err)) return { created: false };
      throw err;
    }
  },

  async deleteByArticleAndFingerprint(input: { articleId: string; fingerprint: string }): Promise<{ deleted: boolean }> {
    const result = await ArticleLikeModel.deleteOne({
      articleId: new Types.ObjectId(input.articleId),
      fingerprint: input.fingerprint,
    }).exec();
    return { deleted: (result.deletedCount ?? 0) > 0 };
  },
};

