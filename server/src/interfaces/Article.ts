export const ArticleStatuses = {
  DRAFT: 'DRAFT',
  EDITING: 'EDITING',
  PUBLISHED: 'PUBLISHED',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type ArticleStatus = typeof ArticleStatuses[keyof typeof ArticleStatuses];

export interface TocItem {
  level: number; // 1 ~ 6
  text: string;
  id: string; // anchor id in HTML
}

/**
 * Article metadata.
 *
 * Notes:
 * - Content is stored separately in `ArticleContent` to keep list queries light.
 * - Slug is generated from title and is unique per author.
 */
export interface Article {
  _id: string;

  authorId: string;
  title: string;
  slug: string;

  summary?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  categoryId?: string | null;

  status: ArticleStatus;
  preDeleteStatus?: ArticleStatus | null;

  firstPublishedAt?: Date | null;
  publishedAt?: Date | null; // last published time (supports "updated at" display)

  views?: number;
  likesCount?: number;

  deletedAt?: Date | null;
  deletedByRole?: 'admin' | 'author' | null;
  deletedBy?: string | null;
  deleteScheduledAt?: Date | null;
  deleteReason?: string | null;

  /**
   * When an admin deletes an article, the author cannot restore it directly.
   * Instead, the author can create a restore request for admin review.
   */
  restoreRequestedAt?: Date | null;
  restoreRequestedMessage?: string | null;

  adminRemark?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleContent {
  _id: string;
  articleId: string;

  markdown: string;
  html?: string | null;
  toc?: TocItem[];
  renderedAt?: Date | null;
  renderer?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
