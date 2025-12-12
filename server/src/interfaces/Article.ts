export interface Article {
  _id: string;

  title: string;
  slug: string;
  slugLocked: boolean;

  content: string;         // markdown
  htmlContent?: string;    // optional: pre-rendered HTML

  authorId: string;
  categoryId: string;
  tagIds: string[];

  coverImageUrl?: string | null;

  status: 'draft' | 'published';

  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date;
}
