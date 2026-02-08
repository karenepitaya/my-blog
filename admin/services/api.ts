import {
  Article,
  ArticleStatus,
  AuthorPreferences,
  Category,
  CategoryStatus,
  SystemConfig,
  Tag,
  User,
  UserRole,
  UserStatus,
} from '../types';
import { request } from './http';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const toStringValue = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const toOptionalString = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value : String(value);
};

const toNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return typeof value === 'string' ? value : String(value);
};

const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && !Number.isNaN(value) ? value : undefined;

const toNumberValue = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && !Number.isNaN(value) ? value : fallback;

type Session = {
  token: string;
  role: UserRole;
};

type ArticleWriteInput = Partial<Article> & {
  slug?: string | null;
  uploadIds?: string[];
};

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type AiProxyMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AiProxyResponse = {
  content: string;
  vendorId: string | null;
  model: string;
  latencyMs: number;
};

const DEFAULT_PAGE_SIZE = 100;

function toPreferences(input: unknown): AuthorPreferences | undefined {
  if (!isRecord(input)) return undefined;
  const aiConfigInput = isRecord(input.aiConfig) ? input.aiConfig : undefined;
  const aiConfig = aiConfigInput
    ? {
        vendorId: toOptionalString(aiConfigInput.vendorId),
        apiKey: toOptionalString(aiConfigInput.apiKey),
        baseUrl: toOptionalString(aiConfigInput.baseUrl),
        model: toOptionalString(aiConfigInput.model),
        prompt: toOptionalString(aiConfigInput.prompt),
      }
    : undefined;

  return {
    articlePageSize: toOptionalNumber(input.articlePageSize),
    recycleBinRetention: toOptionalNumber(input.recycleBinRetention),
    statsLayout: toOptionalString(input.statsLayout),
    aiConfig,
  };
}

const toUser = (input: unknown): User => {
  const record = isRecord(input) ? input : {};
  return {
    id: toStringValue(record.id ?? record._id ?? ''),
    username: toStringValue(record.username ?? ''),
    role: (record.role ?? UserRole.AUTHOR) as UserRole,
    status: (record.status ?? UserStatus.ACTIVE) as UserStatus,
    isActive: typeof record.isActive === 'boolean' ? record.isActive : undefined,
    avatarUrl: toNullableString(record.avatarUrl),
    bio: toNullableString(record.bio),
    displayName: toNullableString(record.displayName),
    email: toNullableString(record.email),
    roleTitle: toNullableString(record.roleTitle),
    emojiStatus: toNullableString(record.emojiStatus),
    bannedAt: toNullableString(record.bannedAt),
    bannedReason: toNullableString(record.bannedReason),
    deleteScheduledAt: toNullableString(record.deleteScheduledAt),
    adminRemark: toNullableString(record.adminRemark),
    adminTags: Array.isArray(record.adminTags) ? record.adminTags.map(String) : [],
    preferences: toPreferences(record.preferences),
    createdAt: toStringValue(record.createdAt, new Date().toISOString()),
    updatedAt: toOptionalString(record.updatedAt),
    lastLoginAt: toNullableString(record.lastLoginAt),
  };
};

const toArticle = (input: unknown): Article => {
  const record = isRecord(input) ? input : {};
  const contentRecord = isRecord(record.content) ? record.content : undefined;
  const markdown =
    (contentRecord && typeof contentRecord.markdown === 'string'
      ? contentRecord.markdown
      : undefined) ?? (typeof record.markdown === 'string' ? record.markdown : undefined);

  return {
    id: toStringValue(record.id ?? record._id ?? ''),
    authorId: toStringValue(record.authorId ?? ''),
    title: toStringValue(record.title ?? ''),
    slug: toStringValue(record.slug ?? ''),
    summary: toNullableString(record.summary),
    coverImageUrl: toNullableString(record.coverImageUrl),
    tags: Array.isArray(record.tags) ? record.tags.map(String) : [],
    categoryId: record.categoryId ? String(record.categoryId) : null,
    status: (record.status ?? ArticleStatus.DRAFT) as ArticleStatus,
    views: toNumberValue(record.views, 0),
    likesCount: toNumberValue(record.likesCount, 0),
    firstPublishedAt: toNullableString(record.firstPublishedAt),
    publishedAt: toNullableString(record.publishedAt),
    deletedAt: toNullableString(record.deletedAt),
    deletedByRole: (record.deletedByRole ?? null) as Article['deletedByRole'],
    deletedBy: toNullableString(record.deletedBy),
    deleteScheduledAt: toNullableString(record.deleteScheduledAt),
    deleteReason: toNullableString(record.deleteReason),
    restoreRequestedAt: toNullableString(record.restoreRequestedAt),
    restoreRequestedMessage: toNullableString(record.restoreRequestedMessage),
    adminRemark: toNullableString(record.adminRemark),
    createdAt: toStringValue(record.createdAt, new Date().toISOString()),
    updatedAt: toStringValue(record.updatedAt, new Date().toISOString()),
    markdown,
  };
};

const toCategory = (input: unknown): Category => {
  const record = isRecord(input) ? input : {};
  return {
    id: toStringValue(record.id ?? record._id ?? ''),
    ownerId: record.ownerId ? String(record.ownerId) : null,
    name: toStringValue(record.name ?? ''),
    slug: toStringValue(record.slug ?? ''),
    description: toNullableString(record.description),
    coverImageUrl: toNullableString(record.coverImageUrl),
    status: (record.status ?? CategoryStatus.ACTIVE) as CategoryStatus,
    deletedAt: toNullableString(record.deletedAt),
    deletedByRole: (record.deletedByRole ?? null) as Category['deletedByRole'],
    deletedBy: toNullableString(record.deletedBy),
    deleteScheduledAt: toNullableString(record.deleteScheduledAt),
    adminRemark: toNullableString(record.adminRemark),
    articleCount: toOptionalNumber(record.articleCount),
    views:
      typeof record.views === 'number'
        ? record.views
        : typeof record.viewCount === 'number'
          ? record.viewCount
          : undefined,
    likes: toOptionalNumber(record.likes),
    createdAt: toOptionalString(record.createdAt),
    updatedAt: toOptionalString(record.updatedAt),
  };
};

const toTag = (input: unknown): Tag => {
  const record = isRecord(input) ? input : {};
  return {
    id: toStringValue(record.id ?? record._id ?? ''),
    name: toStringValue(record.name ?? ''),
    slug: toStringValue(record.slug ?? ''),
    createdBy: record.createdBy ? String(record.createdBy) : null,
    createdAt: toOptionalString(record.createdAt),
    updatedAt: toOptionalString(record.updatedAt),
    articleCount: toOptionalNumber(record.articleCount),
    color: toNullableString(record.color),
    effect: record.effect as Tag['effect'],
    description: toNullableString(record.description),
  };
};

const requireAdmin = (session: Session) => {
  if (session.role !== UserRole.ADMIN) {
    throw new Error('ADMIN_REQUIRED');
  }
};

const requireAuthor = (session: Session) => {
  if (session.role !== UserRole.AUTHOR) {
    throw new Error('AUTHOR_REQUIRED');
  }
};

export const ApiService = {
  async login(
    username: string,
    password: string,
    role: UserRole
  ): Promise<{ user: User; token: string }> {
    const path = role === UserRole.ADMIN ? '/admin/auth/login' : '/auth/login';
    const data = await request<{ user: unknown; token?: string }>(path, {
      method: 'POST',
      body: { username, password },
    });
    return { token: 'cookie', user: toUser(data.user) };
  },

  async getAdminProfile(): Promise<User> {
    const data = await request<unknown>('/admin/auth/me');
    return toUser(data);
  },

  async updateAdminProfile(
    session: Session,
    input: {
      avatarUrl?: string | null;
      bio?: string | null;
      displayName?: string | null;
      email?: string | null;
      roleTitle?: string | null;
      emojiStatus?: string | null;
    }
  ): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>('/admin/auth/me', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async getAuthorProfile(): Promise<User> {
    const data = await request<unknown>('/profile');
    return toUser(data);
  },

  async impersonateAuthor(
    session: Session,
    input: { authorId: string; reason?: string }
  ): Promise<{ token: string; user: User }> {
    requireAdmin(session);
    const data = await request<{ user: unknown }>('/admin/auth/impersonate', {
      method: 'POST',
      body: input,
    });
    return { token: 'cookie', user: toUser(data.user) };
  },

  async exitImpersonation(): Promise<void> {
    await request('/admin/auth/exit-impersonation', { method: 'POST' });
  },

  async logout(role: UserRole): Promise<void> {
    const path = role === UserRole.ADMIN ? '/admin/auth/logout' : '/auth/logout';
    await request(path, { method: 'POST' });
  },

  async getUsers(
    session: Session,
    options?: { q?: string; status?: UserStatus; role?: UserRole; page?: number; pageSize?: number }
  ): Promise<User[]> {
    requireAdmin(session);
    const params = new URLSearchParams();
    params.set('page', String(options?.page ?? 1));
    params.set('pageSize', String(options?.pageSize ?? DEFAULT_PAGE_SIZE));
    if (options?.q) params.set('q', options.q);
    if (options?.status) params.set('status', options.status);
    if (options?.role) params.set('role', options.role);
    const data = await request<PageResult<unknown>>(
      `/admin/users?${params.toString()}`,
      { token: session.token }
    );
    return data.items.map(toUser);
  },

  async getUserDetail(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}`, { token: session.token });
    return toUser(data);
  },

  async createAuthor(
    session: Session,
    input: { username: string; password?: string }
  ): Promise<{ user: User; initialPassword: string | null }> {
    requireAdmin(session);
    const data = await request<{ user: unknown; initialPassword: string | null }>(
      '/admin/users',
      {
        method: 'POST',
        token: session.token,
        body: input,
      }
    );
    return { user: toUser(data.user), initialPassword: data.initialPassword ?? null };
  },

  async resetAuthor(
    session: Session,
    id: string,
    input?: { reason?: string }
  ): Promise<{ user: User; initialPassword: string }> {
    requireAdmin(session);
    const data = await request<{ user: unknown; initialPassword: string }>(
      `/admin/users/${id}/reset`,
      { method: 'POST', token: session.token, body: input ?? {} }
    );
    return { user: toUser(data.user), initialPassword: data.initialPassword };
  },

  async banAuthor(session: Session, id: string, input?: { reason?: string }): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}/ban`, {
      method: 'POST',
      token: session.token,
      body: input ?? {},
    });
    return toUser(data);
  },

  async unbanAuthor(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}/unban`, {
      method: 'POST',
      token: session.token,
    });
    return toUser(data);
  },

  async deleteAuthor(
    session: Session,
    id: string,
    input?: { graceDays?: number }
  ): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}/delete`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays },
    });
    return toUser(data);
  },

  async restoreAuthor(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}/restore`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toUser(data);
  },

  async purgeAuthor(session: Session, id: string): Promise<void> {
    requireAdmin(session);
    await request<{ purged: boolean }>(`/admin/users/${id}/purge`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async updateUserAdminMeta(
    session: Session,
    id: string,
    input: { remark?: string | null; tags?: string[] }
  ): Promise<User> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/users/${id}/admin-meta`, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async getArticles(
    session: Session,
    options?: {
      status?: ArticleStatus;
      authorId?: string;
      categoryId?: string;
      q?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<Article[]> {
    const params = new URLSearchParams();
    params.set('page', String(options?.page ?? 1));
    params.set('pageSize', String(options?.pageSize ?? DEFAULT_PAGE_SIZE));
    if (options?.status) params.set('status', options.status);
    if (options?.q) params.set('q', options.q);
    if (session.role === UserRole.ADMIN && options?.authorId) params.set('authorId', options.authorId);
    if (session.role === UserRole.AUTHOR && options?.categoryId) params.set('categoryId', options.categoryId);

    const path =
      session.role === UserRole.ADMIN
        ? `/admin/articles?${params.toString()}`
        : `/articles?${params.toString()}`;
    const data = await request<PageResult<unknown>>(path, { token: session.token });
    return data.items.map(toArticle);
  },

  async getArticleDetail(session: Session, id: string): Promise<Article> {
    const path = session.role === UserRole.ADMIN ? `/admin/articles/${id}` : `/articles/${id}`;
    const data = await request<unknown>(path, { token: session.token });
    return toArticle(data);
  },

  async createArticle(session: Session, input: ArticleWriteInput): Promise<Article> {
    requireAuthor(session);
    const data = await request<unknown>('/articles', {
      method: 'POST',
      token: session.token,
      body: {
        title: input.title,
        markdown: input.markdown,
        summary: input.summary ?? null,
        slug: input.slug ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        categoryId: input.categoryId ? input.categoryId : null,
        uploadIds: input.uploadIds ?? [],
      },
    });
    return toArticle(data);
  },

  async updateArticle(session: Session, input: ArticleWriteInput): Promise<Article> {
    requireAuthor(session);
    if (!input.id) throw new Error('ARTICLE_ID_REQUIRED');
    const data = await request<unknown>(`/articles/${input.id}`, {
      method: 'PUT',
      token: session.token,
      body: {
        title: input.title,
        markdown: input.markdown,
        summary: input.summary ?? null,
        slug: input.slug ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        categoryId: input.categoryId ? input.categoryId : null,
        uploadIds: input.uploadIds ?? [],
      },
    });
    return toArticle(data);
  },

  async updateArticleCategory(session: Session, id: string, categoryId: string | null): Promise<void> {
    requireAuthor(session);
    await request<unknown>(`/articles/${id}`, {
      method: 'PUT',
      token: session.token,
      body: { categoryId },
    });
  },

  async publishArticle(session: Session, id: string): Promise<Article> {
    requireAuthor(session);
    const data = await request<unknown>(`/articles/${id}/publish`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toArticle(data);
  },

  async unpublishArticle(session: Session, id: string): Promise<Article> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/articles/${id}/unpublish` : `/articles/${id}/unpublish`;
    if (session.role === UserRole.ADMIN) {
      requireAdmin(session);
    } else {
      requireAuthor(session);
    }

    const data = await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toArticle(data);
  },

  async saveDraft(session: Session, id: string): Promise<Article> {
    requireAuthor(session);
    const data = await request<unknown>(`/articles/${id}/save-draft`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toArticle(data);
  },

  async deleteArticle(
    session: Session,
    id: string,
    input?: { graceDays?: number; reason?: string | null }
  ): Promise<void> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/articles/${id}/delete` : `/articles/${id}/delete`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays, reason: input?.reason ?? null },
    });
  },

  async restoreArticle(session: Session, id: string): Promise<void> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/articles/${id}/restore` : `/articles/${id}/restore`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async purgeArticle(session: Session, id: string): Promise<void> {
    const path =
      session.role === UserRole.ADMIN
        ? `/admin/articles/${id}/purge`
        : `/articles/${id}/confirm-delete`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async getCategories(
    session: Session,
    options?: { status?: CategoryStatus; ownerId?: string; page?: number; pageSize?: number }
  ): Promise<Category[]> {
    const params = new URLSearchParams();
    if (session.role === UserRole.ADMIN) {
      const status = options?.status;
      const ownerId = options?.ownerId;
      const explicitPage = options?.page;
      const explicitPageSize = options?.pageSize;

      const fetchPage = async (page: number, pageSize: number) => {
        const p = new URLSearchParams(params);
        p.set('page', String(page));
        p.set('pageSize', String(pageSize));
        if (status) p.set('status', status);
        if (ownerId) p.set('ownerId', ownerId);
        return request<PageResult<unknown>>(`/admin/categories?${p.toString()}`, { token: session.token });
      };

      if (explicitPage === undefined && explicitPageSize === undefined) {
        const pageSize = 100;
        const first = await fetchPage(1, pageSize);
        const items = [...first.items];
        const total = Number(first.total ?? items.length);
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        for (let page = 2; page <= totalPages; page++) {
          const next = await fetchPage(page, pageSize);
          items.push(...(next.items ?? []));
          if ((next.items ?? []).length < pageSize) break;
        }

        return items.map(toCategory);
      }

      const data = await fetchPage(explicitPage ?? 1, explicitPageSize ?? DEFAULT_PAGE_SIZE);
      return (data.items ?? []).map(toCategory);
    }

    if (options?.status) params.set('status', options.status);
    const path = params.toString() ? `/categories?${params.toString()}` : '/categories';
    const data = await request<unknown>(path, { token: session.token });
    const items = Array.isArray(data.items) ? data.items : data.items ?? data;
    return (items ?? []).map(toCategory);
  },

  async getCategoryDetail(session: Session, id: string): Promise<Category> {
    const path = session.role === UserRole.ADMIN ? `/admin/categories/${id}` : `/categories/${id}`;
    const data = await request<unknown>(path, { token: session.token });
    return toCategory(data);
  },

  async saveCategory(session: Session, input: Partial<Category>): Promise<Category> {
    requireAuthor(session);
    if (input.id) {
      const data = await request<unknown>(`/categories/${input.id}`, {
        method: 'PUT',
        token: session.token,
        body: {
          name: input.name,
          slug: input.slug?.trim() || undefined,
          description: input.description ?? null,
          coverImageUrl: input.coverImageUrl ?? null,
        },
      });
      return toCategory(data);
    }

    const data = await request<unknown>('/categories', {
      method: 'POST',
      token: session.token,
      body: {
        name: input.name,
        slug: input.slug?.trim() || undefined,
        description: input.description ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
      },
    });
    return toCategory(data);
  },

  async deleteCategory(
    session: Session,
    id: string,
    input?: { graceDays?: number }
  ): Promise<void> {
    const path =
      session.role === UserRole.ADMIN
        ? `/admin/categories/${id}/delete`
        : `/categories/${id}/delete`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays },
    });
  },

  async restoreCategory(session: Session, id: string): Promise<void> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/categories/${id}/restore` : `/categories/${id}/restore`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async purgeCategory(session: Session, id: string): Promise<void> {
    requireAdmin(session);
    await request<unknown>(`/admin/categories/${id}/purge`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async confirmDeleteCategory(session: Session, id: string): Promise<void> {
    requireAuthor(session);
    await request<unknown>(`/categories/${id}/confirm-delete`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async updateCategoryAdminMeta(
    session: Session,
    id: string,
    input: { remark?: string | null }
  ): Promise<Category> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/categories/${id}/admin-meta`, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toCategory(data);
  },

  async getTags(
    session: Session,
    options?: { q?: string; page?: number; pageSize?: number }
  ): Promise<Tag[]> {
    const params = new URLSearchParams();
    params.set('page', String(options?.page ?? 1));
    params.set('pageSize', String(options?.pageSize ?? DEFAULT_PAGE_SIZE));
    if (options?.q) params.set('q', options.q);
    const path =
      session.role === UserRole.ADMIN ? `/admin/tags?${params.toString()}` : `/tags?${params.toString()}`;
    const data = await request<PageResult<unknown>>(path, { token: session.token });
    return data.items.map(toTag);
  },

  async getTagDetail(session: Session, id: string): Promise<Tag> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/tags/${id}`, { token: session.token });
    return toTag(data);
  },

  async createTag(
    session: Session,
    input: { name: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ): Promise<Tag> {
    requireAuthor(session);
    const data = await request<unknown>('/tags', {
      method: 'POST',
      token: session.token,
      body: input,
    });
    return toTag(data);
  },

  async createAdminTag(
    session: Session,
    input: { name: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ): Promise<Tag> {
    requireAdmin(session);
    const data = await request<unknown>('/admin/tags', {
      method: 'POST',
      token: session.token,
      body: input,
    });
    return toTag(data);
  },

  async updateTag(
    session: Session,
    id: string,
    input: { name?: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ): Promise<Tag> {
    const path = session.role === UserRole.ADMIN ? `/admin/tags/${id}` : `/tags/${id}`;
    const data = await request<unknown>(path, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toTag(data);
  },

  async deleteTag(session: Session, id: string): Promise<void> {
    const path = session.role === UserRole.ADMIN ? `/admin/tags/${id}/delete` : `/tags/${id}/delete`;
    await request<unknown>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async getSystemConfig(session: Session): Promise<SystemConfig> {
    const path = session.role === UserRole.ADMIN ? '/admin/config' : '/config';
    const data = await request<SystemConfig>(path, { token: session.token });
    return data;
  },

  async updateSystemConfig(session: Session, input: SystemConfig): Promise<SystemConfig> {
    requireAdmin(session);
    const data = await request<SystemConfig>('/admin/config', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return data;
  },

  async publishSystemConfig(session: Session, input: SystemConfig): Promise<SystemConfig> {
    requireAdmin(session);
    const data = await request<SystemConfig>('/admin/config/publish', {
      method: 'POST',
      token: session.token,
      body: input,
    });
    return data;
  },

  async previewThemeConfig(
    session: Session,
    input: {
      themes: SystemConfig['frontend']['themes'];
      enableSeasonEffect?: boolean;
      seasonEffectType?: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
      seasonEffectIntensity?: number;
      enableAnniversaryEffect?: boolean;
    }
  ): Promise<{ path: string }> {
    requireAdmin(session);
    return request<{ path: string }>('/admin/config/preview/theme', {
      method: 'POST',
      token: session.token,
      body: input,
    });
  },

  async previewAllSystemConfig(
    session: Session,
    input: SystemConfig
  ): Promise<{ previewPath: string; frontendSiteConfigPath: string; appliedAt: number }> {
    requireAdmin(session);
    return request<{ previewPath: string; frontendSiteConfigPath: string; appliedAt: number }>(
      '/admin/config/preview/all',
      {
        method: 'POST',
        token: session.token,
        body: input,
      }
    );
  },

  async updateProfile(
    session: Session,
    input: {
      avatarUrl?: string | null;
      bio?: string | null;
      displayName?: string | null;
      email?: string | null;
      roleTitle?: string | null;
      emojiStatus?: string | null;
    }
  ): Promise<User> {
    requireAuthor(session);
    const data = await request<unknown>('/profile', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async updateAiConfig(
    session: Session,
    input: {
      vendorId?: string | null;
      apiKey?: string | null;
      baseUrl?: string | null;
      model?: string | null;
      prompt?: string | null;
    }
  ): Promise<User> {
    requireAuthor(session);
    const data = await request<unknown>('/profile/ai-config', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async fetchAiModels(
    session: Session,
    input: { vendorId?: string | null; apiKey?: string | null; baseUrl?: string | null }
  ): Promise<{ models: string[]; latencyMs: number }> {
    requireAuthor(session);
    return request<{ models: string[]; latencyMs: number }>('/profile/ai-config/models', {
      method: 'POST',
      token: session.token,
      body: input,
    });
  },

  async proxyAiRequest(
    session: Session,
    input: {
      vendorId?: string | null;
      apiKey?: string | null;
      baseUrl?: string | null;
      model?: string | null;
      prompt?: string;
      messages?: AiProxyMessage[];
      temperature?: number;
      responseFormat?: 'json_object' | 'text';
    }
  ): Promise<AiProxyResponse> {
    requireAuthor(session);
    return request<AiProxyResponse>('/profile/ai-config/proxy', {
      method: 'POST',
      token: session.token,
      body: input,
    });
  },

  async changePassword(
    session: Session,
    input: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    requireAuthor(session);
    await request<unknown>('/profile/password', {
      method: 'PUT',
      token: session.token,
      body: input,
    });
  },

  async requestArticleRestore(
    session: Session,
    id: string,
    input?: { message?: string | null }
  ): Promise<{ requestedAt: string | null; message: string | null }> {
    requireAuthor(session);
    const data = await request<unknown>(`/articles/${id}/request-restore`, {
      method: 'POST',
      token: session.token,
      body: { message: input?.message ?? null },
    });
    const record = isRecord(data) ? data : {};
    return {
      requestedAt: toNullableString(record.requestedAt),
      message: toNullableString(record.message),
    };
  },

  async confirmDeleteArticle(session: Session, id: string): Promise<void> {
    requireAuthor(session);
    await request<unknown>(`/articles/${id}/confirm-delete`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async updateArticleAdminMeta(
    session: Session,
    id: string,
    input: { remark?: string | null }
  ): Promise<Article> {
    requireAdmin(session);
    const data = await request<unknown>(`/admin/articles/${id}/admin-meta`, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toArticle(data);
  },
};
