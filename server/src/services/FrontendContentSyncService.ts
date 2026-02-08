import fs from 'node:fs/promises';
import path from 'node:path';
import { ArticleRepository } from '../repositories/ArticleRepository';
import { UserRepository } from '../repositories/UserRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { TagRepository } from '../repositories/TagRepository';
import { ArticleStatuses } from '../interfaces/Article';
import { logger } from '../utils/logger';

function parseBool(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value == null) return false;
  const v = String(value).trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'y' || v === 'on';
}

function sanitizePathSegment(value: string): string {
  const raw = String(value ?? '').trim();
  const cleaned = raw
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'unknown';
}

function yamlQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function yamlInlineArray(values: string[]): string {
  return `[${values.map(v => yamlQuote(v)).join(', ')}]`;
}

function dateString(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

async function pathExists(fsPath: string): Promise<boolean> {
  try {
    await fs.access(fsPath);
    return true;
  } catch {
    return false;
  }
}

function buildFrontmatter(input: {
  title: string;
  publishedAt: Date;
  description?: string | null;
  author?: { id: string; username: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  tags: string[];
  tagSlugs: string[];
  coverImageUrl?: string | null;
  serverArticleId: string;
  serverSlug: string;
}): string {
  const lines: string[] = [];
  lines.push('---');
  lines.push(`title: ${yamlQuote(input.title)}`);
  lines.push(`published: ${dateString(input.publishedAt)}`);
  lines.push('draft: false');

  if (input.description && input.description.trim()) {
    const s = input.description.replace(/\s+/g, ' ').trim();
    lines.push(`description: ${yamlQuote(s)}`);
  }

  if (input.author) {
    lines.push(`author: ${yamlQuote(input.author.username)}`);
    lines.push(`authorId: ${yamlQuote(input.author.id)}`);
  }

  if (input.category) {
    lines.push(`category: ${yamlQuote(input.category.name)}`);
    lines.push(`categoryId: ${yamlQuote(input.category.id)}`);
    lines.push(`categorySlug: ${yamlQuote(input.category.slug)}`);
  }

  if (input.tags.length > 0) {
    lines.push(`tags: ${yamlInlineArray(input.tags)}`);
    lines.push(`tagSlugs: ${yamlInlineArray(input.tagSlugs)}`);
  }

  if (input.coverImageUrl && input.coverImageUrl.trim()) {
    lines.push(`coverImageUrl: ${yamlQuote(input.coverImageUrl.trim())}`);
  }

  lines.push(`serverArticleId: ${yamlQuote(input.serverArticleId)}`);
  lines.push(`serverSlug: ${yamlQuote(input.serverSlug)}`);
  lines.push('---');
  return lines.join('\n');
}

async function resolveOutDir(): Promise<string> {
  const raw = process.env.FRONTEND_CONTENT_OUT_DIR?.trim();
  if (raw) {
    return path.isAbsolute(raw) ? raw : path.resolve(process.cwd(), raw);
  }

  const cwd = process.cwd();
  const candidateFromRepoRoot = path.resolve(cwd, 'frontend', 'src', 'content', 'posts', '_generated');
  const candidateFromServerDir = path.resolve(cwd, '..', 'frontend', 'src', 'content', 'posts', '_generated');

  if (await pathExists(path.resolve(candidateFromRepoRoot, '..'))) return candidateFromRepoRoot;
  return candidateFromServerDir;
}

async function removeDirsByArticleIdScan(outDir: string, articleId: string): Promise<number> {
  if (!(await pathExists(outDir))) return 0;

  let removed = 0;
  const entries = await fs.readdir(outDir, { withFileTypes: true });
  const needle = `serverArticleId: '${articleId.replace(/'/g, "''")}'`;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const dirPath = path.join(outDir, entry.name);
    const indexPath = path.join(dirPath, 'index.md');
    if (!(await pathExists(indexPath))) continue;

    try {
      const content = await fs.readFile(indexPath, 'utf8');
      if (!content.includes(needle)) continue;
      await fs.rm(dirPath, { recursive: true, force: true });
      removed++;
    } catch {
    }
  }

  return removed;
}

async function removeExportByMeta(outDir: string, input: { authorId: string; slug: string }): Promise<number> {
  const slug = String(input.slug ?? '').trim().toLowerCase();
  if (!slug) return 0;

  const authorId = String(input.authorId);
  const author = await UserRepository.findById(authorId);
  const username = author?.username ? String(author.username) : `author-${authorId.slice(-6)}`;

  const folderName = sanitizePathSegment(`${sanitizePathSegment(username)}--${sanitizePathSegment(slug)}`);
  const targetDir = path.resolve(outDir, folderName);

  try {
    await fs.rm(targetDir, { recursive: true, force: true });
    return 1;
  } catch {
    return 0;
  }
}

async function exportPublishedArticle(outDir: string, articleId: string): Promise<string | null> {
  const article = await ArticleRepository.findMetaById(articleId);
  if (!article) return null;
  if (article.status !== ArticleStatuses.PUBLISHED) return null;

  const content = await ArticleRepository.findContentByArticleId(articleId);
  if (!content?.markdown) return null;

  const authorId = String(article.authorId);
  const author = await UserRepository.findById(authorId);
  const username = author?.username ? String(author.username) : `author-${authorId.slice(-6)}`;

  const slug = String(article.slug ?? '').trim().toLowerCase();
  if (!slug) return null;

  const categoryId = article.categoryId ? String(article.categoryId) : null;
  const category = categoryId ? await CategoryRepository.findById(categoryId) : null;

  const tagSlugs: string[] = Array.isArray(article.tags) ? article.tags.map(String) : [];
  const tagDocs = tagSlugs.length > 0 ? await TagRepository.findManyBySlugs(tagSlugs) : [];
  const tagBySlug = new Map(tagDocs.map(t => [String(t.slug), t]));
  const tagNames = tagSlugs.map(slug => String(tagBySlug.get(slug)?.name ?? slug));

    const frontmatter = buildFrontmatter({
      title: String(article.title ?? '').trim() || '(untitled)',
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt),
      description: article.summary ?? null,
      author: { id: authorId, username },
      category: category
        ? {
          id: categoryId!,
          name: String(category.name ?? ''),
          slug: String(category.slug ?? ''),
        }
        : null,
      tags: tagNames,
      tagSlugs,
      coverImageUrl: article.coverImageUrl ?? null,
      serverArticleId: articleId,
      serverSlug: slug,
    });

    const body = String(content.markdown ?? '').replace(/\r\n/g, '\n').trimEnd();
  const output = `${frontmatter}\n\n${body}\n`;

  const folderName = sanitizePathSegment(`${sanitizePathSegment(username)}--${sanitizePathSegment(slug)}`);
  const targetDir = path.resolve(outDir, folderName);
  const targetFile = path.join(targetDir, 'index.md');

  await fs.mkdir(targetDir, { recursive: true });
  await fs.writeFile(targetFile, output, 'utf8');
  return targetFile;
}

export const FrontendContentSyncService = {
  enabled(): boolean {
    if (process.env.FRONTEND_CONTENT_SYNC !== undefined) {
      return parseBool(process.env.FRONTEND_CONTENT_SYNC);
    }

    // CONTRACT: Sync is opt-in to avoid duplicate storage when frontend reads via API.
    return false;
  },

  async syncArticleById(articleId: string): Promise<void> {
    if (!FrontendContentSyncService.enabled()) return;

    try {
      const outDir = await resolveOutDir();
      await fs.mkdir(outDir, { recursive: true });

      const article = await ArticleRepository.findMetaById(articleId);
      if (!article) {
        const removed = await removeDirsByArticleIdScan(outDir, articleId);
        if (removed > 0) {
          logger.info(`Frontend content removed for deleted article ${articleId} (dirs: ${removed}).`);
        }
        return;
      }

      if (article.status !== ArticleStatuses.PUBLISHED) {
        const removedByMeta = await removeExportByMeta(outDir, {
          authorId: String(article.authorId),
          slug: String(article.slug ?? ''),
        });
        const removedByScan = await removeDirsByArticleIdScan(outDir, articleId);
        const removed = removedByMeta + removedByScan;
        if (removed > 0) {
          logger.info(`Frontend content removed for article ${articleId} (status: ${article.status}).`);
        }
        return;
      }

      const file = await exportPublishedArticle(outDir, articleId);
      if (file) {
        logger.info(`Frontend content synced: ${file}`);
      }
    } catch (err) {
      logger.error('Frontend content sync failed:', err);
    }
  },
};
