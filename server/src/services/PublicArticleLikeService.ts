import type { Request } from 'express';
import { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { ArticleLikeRepository } from '../repositories/ArticleLikeRepository';
import { ArticleStatuses } from '../interfaces/Article';
import { isAuthorPubliclyVisible } from './PublicAuthorVisibility';

const LIKE_FINGERPRINT_SALT = String(process.env.LIKE_FINGERPRINT_SALT ?? 'likes_v1');

const INFLIGHT_TTL_MS = 3_000;
const inflight = new Map<string, { startedAt: number; promise: Promise<{ likesCount: number; liked: boolean }> }>();
let lastInflightCleanupAt = 0;
const INFLIGHT_CLEANUP_INTERVAL_MS = 5_000;

function cleanupInflightIfNeeded(now: number) {
  if (now - lastInflightCleanupAt < INFLIGHT_CLEANUP_INTERVAL_MS) return;
  lastInflightCleanupAt = now;
  for (const [key, value] of inflight) {
    if (now - value.startedAt > INFLIGHT_TTL_MS) inflight.delete(key);
  }
}

function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim();
  }
  const ip = (req.ip ?? '').trim();
  return ip || undefined;
}

function toFingerprint(req: Request): string {
  const ip = getClientIp(req) ?? 'unknown-ip';
  const userAgent = String(req.headers['user-agent'] ?? '').trim();
  const raw = `${LIKE_FINGERPRINT_SALT}|${ip}|${userAgent}`;
  return createHash('sha256').update(raw).digest('base64url');
}

async function ensurePublicArticleExistsOrThrow(articleId: string) {
  if (!Types.ObjectId.isValid(articleId)) {
    throw { status: 400, code: 'INVALID_ID', message: 'Invalid article id' };
  }

  const article = await ArticleRepository.findMetaById(articleId);
  if (!article || article.status !== ArticleStatuses.PUBLISHED) {
    throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
  }

  const visible = await isAuthorPubliclyVisible(String(article.authorId));
  if (!visible) {
    throw { status: 404, code: 'ARTICLE_NOT_FOUND', message: 'Article not found' };
  }

  return article;
}

async function getLikesCountOrZero(articleId: string): Promise<number> {
  const doc = await ArticleRepository.findMetaById(articleId);
  return Math.max(0, Number((doc as any)?.likesCount ?? 0) || 0);
}

export const PublicArticleLikeService = {
  async get(req: Request, input: { id: string }) {
    const article = await ensurePublicArticleExistsOrThrow(input.id);
    const likesCount = Math.max(0, Number((article as any).likesCount ?? 0) || 0);

    const fingerprint = toFingerprint(req);
    const liked = await ArticleLikeRepository.existsByArticleAndFingerprint({
      articleId: input.id,
      fingerprint,
    });

    return { likesCount, liked };
  },

  async like(req: Request, input: { id: string }) {
    const now = Date.now();
    cleanupInflightIfNeeded(now);

    const fingerprint = toFingerprint(req);
    const key = `like:${input.id}:${fingerprint}`;
    const existing = inflight.get(key);
    if (existing) return existing.promise;

    const promise = (async () => {
      await ensurePublicArticleExistsOrThrow(input.id);

      const { created } = await ArticleLikeRepository.createIfNotExists({
        articleId: input.id,
        fingerprint,
      });

      if (created) {
        await ArticleRepository.incrementLikesCount(input.id, 1);
      }

      const likesCount = await getLikesCountOrZero(input.id);
      return { likesCount, liked: true };
    })();

    inflight.set(key, { startedAt: now, promise });

    try {
      return await promise;
    } finally {
      inflight.delete(key);
    }
  },

  async unlike(req: Request, input: { id: string }) {
    const now = Date.now();
    cleanupInflightIfNeeded(now);

    const fingerprint = toFingerprint(req);
    const key = `unlike:${input.id}:${fingerprint}`;
    const existing = inflight.get(key);
    if (existing) return existing.promise;

    const promise = (async () => {
      await ensurePublicArticleExistsOrThrow(input.id);

      const { deleted } = await ArticleLikeRepository.deleteByArticleAndFingerprint({
        articleId: input.id,
        fingerprint,
      });

      if (deleted) {
        await ArticleRepository.decrementLikesCountClamp(input.id, 1);
      }

      const likesCount = await getLikesCountOrZero(input.id);
      return { likesCount, liked: false };
    })();

    inflight.set(key, { startedAt: now, promise });

    try {
      return await promise;
    } finally {
      inflight.delete(key);
    }
  },
};

