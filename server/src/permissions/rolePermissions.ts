import { Roles } from './roles';
import { Permissions } from './permissions';

export const rolePermissions: Record<string, Set<string>> = {
  [Roles.ADMIN]: new Set([
    Permissions.USER_MANAGE,
    Permissions.ARTICLE_HIDE,
    Permissions.CATEGORY_MANAGE,
    Permissions.TAG_MANAGE,
    Permissions.SYSTEM_CONFIG,
  ]),
  [Roles.AUTHOR]: new Set([
    Permissions.ARTICLE_CREATE,
    Permissions.ARTICLE_UPDATE,
    Permissions.ARTICLE_PUBLISH,
  ]),
};
