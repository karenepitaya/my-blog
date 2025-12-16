export const Permissions = {
  USER_MANAGE: 'user:manage',

  ARTICLE_CREATE: 'article:create',
  ARTICLE_UPDATE: 'article:update',
  ARTICLE_PUBLISH: 'article:publish',

  ARTICLE_HIDE: 'article:hide',

  CATEGORY_MANAGE: 'category:manage',
  TAG_MANAGE: 'tag:manage',

  SYSTEM_CONFIG: 'system:config',
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
