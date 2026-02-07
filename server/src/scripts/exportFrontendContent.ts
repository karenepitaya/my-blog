/**
 * Export published articles from MongoDB into the frontend (MultiTerm) content format.
 *
 * Default behavior is safe (dry-run). Use `--yes` to write files.
 *
 * Usage:
 *   pnpm ts-node src/scripts/exportFrontendContent.ts --help
 *   pnpm ts-node src/scripts/exportFrontendContent.ts --yes
 *   pnpm ts-node src/scripts/exportFrontendContent.ts --yes --out-dir ../frontend/src/content/posts/_generated
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import mongoose, { Types } from 'mongoose';
import { loadScriptEnv } from './scriptEnv';
import { ArticleModel } from '../models/ArticleModel';
import { ArticleContentModel } from '../models/ArticleContentModel';
import { UserModel } from '../models/UserModel';
import { CategoryModel } from '../models/CategoryModel';
import { TagModel } from '../models/TagModel';
import { ArticleStatuses } from '../interfaces/Article';

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag) || argv.includes(flag.replace(/^--/, '-'));
}

function getFlagValue(argv: string[], flag: string): string | undefined {
  const eq = argv.find(a => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);

  const index = argv.indexOf(flag);
  if (index !== -1 && index + 1 < argv.length) return argv[index + 1];

  return undefined;
}

function printHelp(): void {
  console.log(`
Usage:
  ts-node src/scripts/exportFrontendContent.ts [--out-dir <path>] [--limit <n>] [--yes]

Options:
  --out-dir   Output directory (default: ../frontend/src/content/posts/_generated)
  --limit     Max number of articles to export (default: no limit)
  --yes       Actually write files (default: dry-run)
  -h, --help  Show help
`);
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

function sanitizePathSegment(value: string): string {
  const raw = String(value ?? '').trim();
  const cleaned = raw
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-') // Windows + control chars
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'unknown';
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

type ArticleLean = {
  _id: unknown;
  authorId: unknown;
  categoryId?: unknown | null;
  slug?: string;
  title?: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  publishedAt?: Date | null;
  createdAt: Date;
};

type ArticleContentLean = {
  articleId: unknown;
  markdown?: string;
};

type AuthorLean = {
  _id: unknown;
  username?: string;
};

type CategoryLean = {
  _id: unknown;
  name?: string;
  slug?: string;
};

type TagLean = {
  slug?: string;
  name?: string;
};

async function main() {
  const argv = process.argv.slice(2);

  if (hasFlag(argv, '--help') || hasFlag(argv, '-h')) {
    printHelp();
    return;
  }

  const outDirFromArgs = getFlagValue(argv, '--out-dir');
  const limitRaw = getFlagValue(argv, '--limit');
  const yes = hasFlag(argv, '--yes');

  const outDir =
    outDirFromArgs?.trim() ||
    path.resolve(process.cwd(), '..', 'frontend', 'src', 'content', 'posts', '_generated');

  const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw))) : undefined;

  const { mongoUri } = loadScriptEnv();
  await mongoose.connect(mongoUri);

  try {
    const articles = (await ArticleModel.find({ status: ArticleStatuses.PUBLISHED })
      .sort({ publishedAt: 1, _id: 1 })
      .limit(limit ?? 0)
      .lean()
      .exec()) as ArticleLean[];

    if (articles.length === 0) {
      console.log('No published articles found.');
      return;
    }

    const articleIds = articles.map(a => String(a._id));
    const authorIds = Array.from(new Set(articles.map(a => String(a.authorId))));
    const categoryIds = Array.from(
      new Set(articles.map(a => (a.categoryId ? String(a.categoryId) : null)).filter(Boolean)),
    ) as string[];
    const tagSlugs = Array.from(
      new Set(articles.flatMap(a => (Array.isArray(a.tags) ? a.tags : [])).map(String)),
    ).filter(Boolean);

    const [contents, authors, categories, tags] = await Promise.all([
      ArticleContentModel.find({ articleId: { $in: articleIds.map(id => new Types.ObjectId(id)) } })
        .lean()
        .exec() as Promise<ArticleContentLean[]>,
      UserModel.find({ _id: { $in: authorIds.map(id => new Types.ObjectId(id)) } })
        .select({ username: 1 })
        .lean()
        .exec() as Promise<AuthorLean[]>,
      categoryIds.length > 0
        ? CategoryModel.find({ _id: { $in: categoryIds.map(id => new Types.ObjectId(id)) } })
            .select({ name: 1, slug: 1 })
            .lean()
            .exec() as Promise<CategoryLean[]>
        : Promise.resolve([]),
      tagSlugs.length > 0
        ? TagModel.find({ slug: { $in: tagSlugs } })
            .select({ name: 1, slug: 1 })
            .lean()
            .exec() as Promise<TagLean[]>
        : Promise.resolve([]),
    ]);

    const contentByArticleId = new Map(contents.map(c => [String(c.articleId), c]));
    const authorById = new Map(authors.map(a => [String(a._id), a]));
    const categoryById = new Map(categories.map(c => [String(c._id), c]));
    const tagBySlug = new Map(tags.map(t => [String(t.slug), t]));

    console.log('----------------------------------------');
    console.log(`Articles to export: ${articles.length}`);
    console.log(`Output directory:   ${outDir}`);
    console.log(`Mode:               ${yes ? 'WRITE' : 'DRY-RUN'} (use --yes to write)`);
    console.log('----------------------------------------');

    let exported = 0;

    for (const article of articles) {
      const articleId = String(article._id);
      const content = contentByArticleId.get(articleId);
      if (!content?.markdown) {
        console.warn(`Skipping ${articleId}: missing markdown content.`);
        continue;
      }

      const authorId = String(article.authorId);
      const author = authorById.get(authorId);
      const username = author?.username ? String(author.username) : `author-${authorId.slice(-6)}`;
      const safeUser = sanitizePathSegment(username);

      const slug = String(article.slug ?? '').trim().toLowerCase();
      if (!slug) {
        console.warn(`Skipping ${articleId}: missing slug.`);
        continue;
      }

      const folderName = sanitizePathSegment(`${safeUser}--${slug}`);
      const targetDir = path.resolve(outDir, folderName);
      const targetFile = path.join(targetDir, 'index.md');

      const categoryId = article.categoryId ? String(article.categoryId) : null;
      const categoryDoc = categoryId ? categoryById.get(categoryId) ?? null : null;

      const tagSlugList: string[] = Array.isArray(article.tags) ? article.tags.map(String) : [];
      const tagNames = tagSlugList
        .map(s => tagBySlug.get(s))
        .filter(Boolean)
        .map(tag => String(tag?.name ?? '').trim())
        .filter(Boolean);

      const frontmatter = buildFrontmatter({
        title: String(article.title ?? '').trim() || '(untitled)',
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt),
        description: article.summary ?? null,
        author: { id: authorId, username },
        category: categoryDoc
          ? {
              id: categoryId!,
              name: String(categoryDoc.name),
              slug: String(categoryDoc.slug),
            }
          : null,
        tags: tagNames.length > 0 ? tagNames : tagSlugList,
        tagSlugs: tagSlugList,
        coverImageUrl: article.coverImageUrl ?? null,
        serverArticleId: articleId,
        serverSlug: slug,
      });

      const body = String(content.markdown ?? '').replace(/\r\n/g, '\n').trimEnd();
      const output = `${frontmatter}\n\n${body}\n`;

      if (yes) {
        await fs.mkdir(targetDir, { recursive: true });
        await fs.writeFile(targetFile, output, 'utf8');
      }

      exported++;
      console.log(`${yes ? 'Wrote' : 'Would write'} ${path.relative(process.cwd(), targetFile)}`);
    }

    console.log('----------------------------------------');
    console.log(`Done. Exported ${exported} articles.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
