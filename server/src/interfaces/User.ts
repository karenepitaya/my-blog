export const UserStatuses = {
  ACTIVE: 'ACTIVE',
  BANNED: 'BANNED',
  PENDING_DELETE: 'PENDING_DELETE',
} as const;

export type UserStatus = typeof UserStatuses[keyof typeof UserStatuses];

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

  createdAt: Date;
  updatedAt: Date;
}
