import type { User, UserStatus } from '../interfaces/User';
import { UserStatuses } from '../interfaces/User';

export function getEffectiveUserStatus(
  user: Pick<User, 'status' | 'isActive' | 'deleteScheduledAt'>
): UserStatus {
  if (user.status) return user.status;
  if (user.deleteScheduledAt) return UserStatuses.PENDING_DELETE;
  return user.isActive === false ? UserStatuses.BANNED : UserStatuses.ACTIVE;
}

export function canUserLogin(
  user: Pick<User, 'status' | 'isActive' | 'deleteScheduledAt'>
): boolean {
  return getEffectiveUserStatus(user) === UserStatuses.ACTIVE;
}
