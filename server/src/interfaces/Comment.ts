export interface Comment {
  _id: string;

  articleId: string;
  author: string;        // anonymous name or user
  content: string;

  parentId?: string | null; // for nested comments

  createdAt: Date;
}
