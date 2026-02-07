import type { UserRole, UserStatus } from '../shared/enums';
export { UserRole, UserStatus, UserStatuses } from '../shared/enums';

export type AuthorAiConfig = {
  vendorId?: string | null;
  apiKey?: string | null;
  baseUrl?: string | null;
  model?: string | null;
  prompt?: string | null;
};

export type AuthorPreferences = {
  aiConfig?: AuthorAiConfig;
};

export interface User {
  _id: string;
  username: string;
  passwordHash: string;
  role: UserRole;

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
  displayName?: string | null;
  email?: string | null;
  roleTitle?: string | null;
  emojiStatus?: string | null;
  preferences?: AuthorPreferences;

  createdAt: Date;
  updatedAt: Date;
}
