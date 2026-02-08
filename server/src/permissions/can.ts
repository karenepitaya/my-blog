import { Role } from './roles';
import { Permission } from './permissions';
import { rolePermissions } from './rolePermissions';

export interface CanContext {
  role: Role;
  permission: Permission;
  userId?: string;
  ownerId?: string;
}

export function can(ctx: CanContext): boolean {
  const { role, permission, userId, ownerId } = ctx;

  const perms = rolePermissions[role];
  if (!perms || !perms.has(permission)) return false;

  // CONTRACT: Authors may only access their own article resources.
  if (role === 'author' && permission.startsWith('article:')) {
    if (!userId || !ownerId) return false;
    return userId === ownerId;
  }

  return true;
}
