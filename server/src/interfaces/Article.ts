import type { ArticleStatus } from '../shared/enums';
export { ArticleStatus, ArticleStatuses } from '../shared/enums';

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

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
  publishedAt?: Date | null;

  views?: number;
  likesCount?: number;

  deletedAt?: Date | null;
  deletedByRole?: 'admin' | 'author' | null;
  deletedBy?: string | null;
  deleteScheduledAt?: Date | null;
  deleteReason?: string | null;

  // CONTRACT: Admin-deleted articles require a restore request.
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
