import { Role } from './roles';
import { Permission } from './permissions';
import { rolePermissions } from './rolePermissions';

export interface CanContext {
  role: Role;
  permission: Permission;

  // 可选：做“资源归属”判断用
  userId?: string;
  ownerId?: string;
}

export function can(ctx: CanContext): boolean {
  const { role, permission, userId, ownerId } = ctx;

  const perms = rolePermissions[role];
  if (!perms || !perms.has(permission)) return false;

  // 只有 author 才需要做“是否本人资源”的判断
  if (role === 'author' && permission.startsWith('article:')) {
    if (!userId || !ownerId) return false;
    return userId === ownerId;
  }

  return true;
}
