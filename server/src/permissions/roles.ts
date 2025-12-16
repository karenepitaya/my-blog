export const Roles = {
  ADMIN: 'admin',
  AUTHOR: 'author',
} as const;

export type Role = typeof Roles[keyof typeof Roles];
