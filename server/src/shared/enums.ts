export const UserRole = {
  ADMIN: 'admin',
  AUTHOR: 'author',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
export const UserStatuses = UserStatus;

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  EDITING: 'EDITING',
  PUBLISHED: 'PUBLISHED',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];
export const ArticleStatuses = ArticleStatus;

export const CategoryStatus = {
  ACTIVE: 'ACTIVE',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type CategoryStatus = (typeof CategoryStatus)[keyof typeof CategoryStatus];
export const CategoryStatuses = CategoryStatus;
