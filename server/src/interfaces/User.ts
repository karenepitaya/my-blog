export const UserStatuses = {
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type UserStatus = typeof UserStatuses[keyof typeof UserStatuses];

export type AuthorAiConfig = {
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
};

export type AuthorPreferences = {
  aiConfig?: AuthorAiConfig;
};

export interface User {
  _id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'author';

  isActive?: boolean;
  status?: UserStatus;
  bannedAt?: Date | null;
  bannedReason?: string | null;
  deleteScheduledAt?: Date | null;
  lastLoginAt?: Date | null;

  adminRemark?: string | null;
  adminTags?: string[];

  avatarUrl?: string | null;
  bio?: string | null;
  preferences?: AuthorPreferences;

  createdAt: Date;
  updatedAt: Date;
}
