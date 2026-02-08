export interface Comment {
  _id: string;

  articleId: string;
  author: string;
  content: string;

  parentId?: string | null;

  createdAt: Date;
}
