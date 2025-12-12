export interface User {
  _id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'author';

  avatarUrl?: string | null;
  bio?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
