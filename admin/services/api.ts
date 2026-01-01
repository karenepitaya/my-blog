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

type Session = {
  token: string;
  role: UserRole;
};

type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

type DebugAccount = {
  username: string;
  password: string;
};

type DebugAccounts = {
  admin: DebugAccount | null;
  author: DebugAccount | null;
};

const DEFAULT_PAGE_SIZE = 100;

function toPreferences(input: any): AuthorPreferences | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const aiConfig =
    input.aiConfig && typeof input.aiConfig === 'object'
      ? {
          apiKey: input.aiConfig.apiKey ? String(input.aiConfig.apiKey) : undefined,
          baseUrl: input.aiConfig.baseUrl ? String(input.aiConfig.baseUrl) : undefined,
          model: input.aiConfig.model ? String(input.aiConfig.model) : undefined,
        }
      : undefined;

  return {
    articlePageSize: typeof input.articlePageSize === 'number' ? input.articlePageSize : undefined,
    recycleBinRetention: typeof input.recycleBinRetention === 'number' ? input.recycleBinRetention : undefined,
    statsLayout: input.statsLayout ? String(input.statsLayout) : undefined,
    aiConfig,
  };
}

const toUser = (input: any): User => ({
  id: String(input.id ?? input._id ?? ''),
  username: String(input.username ?? ''),
  role: input.role as UserRole,
  status: input.status as UserStatus,
  isActive: input.isActive ?? undefined,
  avatarUrl: input.avatarUrl ?? null,
  bio: input.bio ?? null,
  bannedAt: input.bannedAt ?? null,
  bannedReason: input.bannedReason ?? null,
  deleteScheduledAt: input.deleteScheduledAt ?? null,
  adminRemark: input.adminRemark ?? null,
  adminTags: Array.isArray(input.adminTags) ? input.adminTags.map(String) : [],
  preferences: toPreferences(input.preferences),
  createdAt: input.createdAt ?? new Date().toISOString(),
  updatedAt: input.updatedAt ?? undefined,
  lastLoginAt: input.lastLoginAt ?? null,
});

const toArticle = (input: any): Article => ({
  id: String(input.id ?? input._id ?? ''),
  authorId: String(input.authorId ?? ''),
  title: String(input.title ?? ''),
  slug: String(input.slug ?? ''),
  summary: input.summary ?? null,
  coverImageUrl: input.coverImageUrl ?? null,
  tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
  categoryId: input.categoryId ? String(input.categoryId) : null,
  status: input.status as ArticleStatus,
  views: Number(input.views ?? 0),
  firstPublishedAt: input.firstPublishedAt ?? null,
  publishedAt: input.publishedAt ?? null,
  deletedAt: input.deletedAt ?? null,
  deletedByRole: input.deletedByRole ?? null,
  deletedBy: input.deletedBy ?? null,
  deleteScheduledAt: input.deleteScheduledAt ?? null,
  deleteReason: input.deleteReason ?? null,
  restoreRequestedAt: input.restoreRequestedAt ?? null,
  restoreRequestedMessage: input.restoreRequestedMessage ?? null,
  adminRemark: input.adminRemark ?? null,
  createdAt: input.createdAt ?? new Date().toISOString(),
  updatedAt: input.updatedAt ?? new Date().toISOString(),
  markdown: input.content?.markdown ?? input.markdown ?? undefined,
});

const toCategory = (input: any): Category => ({
  id: String(input.id ?? input._id ?? ''),
  ownerId: input.ownerId ? String(input.ownerId) : null,
  name: String(input.name ?? ''),
  slug: String(input.slug ?? ''),
  description: input.description ?? null,
  coverImageUrl: input.coverImageUrl ?? null,
  status: input.status as CategoryStatus,
  deletedAt: input.deletedAt ?? null,
  deletedByRole: input.deletedByRole ?? null,
  deletedBy: input.deletedBy ?? null,
  deleteScheduledAt: input.deleteScheduledAt ?? null,
  adminRemark: input.adminRemark ?? null,
  articleCount: input.articleCount ?? undefined,
  createdAt: input.createdAt ?? undefined,
  updatedAt: input.updatedAt ?? undefined,
});

const toTag = (input: any): Tag => ({
  id: String(input.id ?? input._id ?? ''),
  name: String(input.name ?? ''),
  slug: String(input.slug ?? ''),
  createdBy: input.createdBy ? String(input.createdBy) : null,
  createdAt: input.createdAt ?? undefined,
  updatedAt: input.updatedAt ?? undefined,
  articleCount: input.articleCount ?? undefined,
  color: input.color ?? null,
  effect: input.effect ?? undefined,
  description: input.description ?? null,
});

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
    const data = await request<{ token: string; user: any }>(path, {
      method: 'POST',
      body: { username, password },
    });
    return { token: data.token, user: toUser(data.user) };
  },

  async getDebugAccounts(): Promise<DebugAccounts> {
    return request<DebugAccounts>('/admin/auth/debug-accounts');
  },

  async getAdminProfile(token: string): Promise<User> {
    const data = await request<any>('/admin/auth/me', { token });
    return toUser(data);
  },

  async getAuthorProfile(token: string): Promise<User> {
    const data = await request<any>('/profile', { token });
    return toUser(data);
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
    const data = await request<PageResult<any>>(
      `/admin/users?${params.toString()}`,
      { token: session.token }
    );
    return data.items.map(toUser);
  },

  async getUserDetail(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<any>(`/admin/users/${id}`, { token: session.token });
    return toUser(data);
  },

  async createAuthor(
    session: Session,
    input: { username: string; password?: string }
  ): Promise<{ user: User; initialPassword: string | null }> {
    requireAdmin(session);
    const data = await request<{ user: any; initialPassword: string | null }>(
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
    const data = await request<{ user: any; initialPassword: string }>(
      `/admin/users/${id}/reset`,
      { method: 'POST', token: session.token, body: input ?? {} }
    );
    return { user: toUser(data.user), initialPassword: data.initialPassword };
  },

  async banAuthor(session: Session, id: string, input?: { reason?: string }): Promise<User> {
    requireAdmin(session);
    const data = await request<any>(`/admin/users/${id}/ban`, {
      method: 'POST',
      token: session.token,
      body: input ?? {},
    });
    return toUser(data);
  },

  async unbanAuthor(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<any>(`/admin/users/${id}/unban`, {
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
    const data = await request<any>(`/admin/users/${id}/delete`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays },
    });
    return toUser(data);
  },

  async restoreAuthor(session: Session, id: string): Promise<User> {
    requireAdmin(session);
    const data = await request<any>(`/admin/users/${id}/restore`, {
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
    const data = await request<any>(`/admin/users/${id}/admin-meta`, {
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
    const data = await request<PageResult<any>>(path, { token: session.token });
    return data.items.map(toArticle);
  },

  async getArticleDetail(session: Session, id: string): Promise<Article> {
    const path = session.role === UserRole.ADMIN ? `/admin/articles/${id}` : `/articles/${id}`;
    const data = await request<any>(path, { token: session.token });
    return toArticle(data);
  },

  async createArticle(session: Session, input: Partial<Article>): Promise<Article> {
    requireAuthor(session);
    const data = await request<any>('/articles', {
      method: 'POST',
      token: session.token,
      body: {
        title: input.title,
        markdown: input.markdown,
        summary: input.summary ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        categoryId: input.categoryId ? input.categoryId : null,
      },
    });
    return toArticle(data);
  },

  async updateArticle(session: Session, input: Partial<Article>): Promise<Article> {
    requireAuthor(session);
    if (!input.id) throw new Error('ARTICLE_ID_REQUIRED');
    const data = await request<any>(`/articles/${input.id}`, {
      method: 'PUT',
      token: session.token,
      body: {
        title: input.title,
        markdown: input.markdown,
        summary: input.summary ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        tags: input.tags ?? [],
        categoryId: input.categoryId ? input.categoryId : null,
      },
    });
    return toArticle(data);
  },

  async publishArticle(session: Session, id: string): Promise<Article> {
    requireAuthor(session);
    const data = await request<any>(`/articles/${id}/publish`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toArticle(data);
  },

  async unpublishArticle(session: Session, id: string): Promise<Article> {
    requireAuthor(session);
    const data = await request<any>(`/articles/${id}/unpublish`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
    return toArticle(data);
  },

  async saveDraft(session: Session, id: string): Promise<Article> {
    requireAuthor(session);
    const data = await request<any>(`/articles/${id}/save-draft`, {
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
    await request<any>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays, reason: input?.reason ?? null },
    });
  },

  async restoreArticle(session: Session, id: string): Promise<void> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/articles/${id}/restore` : `/articles/${id}/restore`;
    await request<any>(path, {
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
    await request<any>(path, {
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
      params.set('page', String(options?.page ?? 1));
      params.set('pageSize', String(options?.pageSize ?? DEFAULT_PAGE_SIZE));
      if (options?.status) params.set('status', options.status);
      if (options?.ownerId) params.set('ownerId', options.ownerId);
      const data = await request<PageResult<any>>(`/admin/categories?${params.toString()}`, {
        token: session.token,
      });
      return data.items.map(toCategory);
    }

    if (options?.status) params.set('status', options.status);
    const path = params.toString() ? `/categories?${params.toString()}` : '/categories';
    const data = await request<any>(path, { token: session.token });
    const items = Array.isArray(data.items) ? data.items : data.items ?? data;
    return (items ?? []).map(toCategory);
  },

  async getCategoryDetail(session: Session, id: string): Promise<Category> {
    const path = session.role === UserRole.ADMIN ? `/admin/categories/${id}` : `/categories/${id}`;
    const data = await request<any>(path, { token: session.token });
    return toCategory(data);
  },

  async saveCategory(session: Session, input: Partial<Category>): Promise<Category> {
    requireAuthor(session);
    if (input.id) {
      const data = await request<any>(`/categories/${input.id}`, {
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

    const data = await request<any>('/categories', {
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
    await request<any>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true, graceDays: input?.graceDays },
    });
  },

  async restoreCategory(session: Session, id: string): Promise<void> {
    const path =
      session.role === UserRole.ADMIN ? `/admin/categories/${id}/restore` : `/categories/${id}/restore`;
    await request<any>(path, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async purgeCategory(session: Session, id: string): Promise<void> {
    requireAdmin(session);
    await request<any>(`/admin/categories/${id}/purge`, {
      method: 'POST',
      token: session.token,
      body: { confirm: true },
    });
  },

  async confirmDeleteCategory(session: Session, id: string): Promise<void> {
    requireAuthor(session);
    await request<any>(`/categories/${id}/confirm-delete`, {
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
    const data = await request<any>(`/admin/categories/${id}/admin-meta`, {
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
    const data = await request<PageResult<any>>(path, { token: session.token });
    return data.items.map(toTag);
  },

  async getTagDetail(session: Session, id: string): Promise<Tag> {
    requireAdmin(session);
    const data = await request<any>(`/admin/tags/${id}`, { token: session.token });
    return toTag(data);
  },

  async createTag(
    session: Session,
    input: { name: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ): Promise<Tag> {
    requireAuthor(session);
    const data = await request<any>('/tags', {
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
    const data = await request<any>('/admin/tags', {
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
    const data = await request<any>(path, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toTag(data);
  },

  async deleteTag(session: Session, id: string): Promise<void> {
    const path = session.role === UserRole.ADMIN ? `/admin/tags/${id}/delete` : `/tags/${id}/delete`;
    await request<any>(path, {
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

  async updateProfile(
    session: Session,
    input: { avatarUrl?: string | null; bio?: string | null }
  ): Promise<User> {
    requireAuthor(session);
    const data = await request<any>('/profile', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async updateAiConfig(
    session: Session,
    input: { apiKey?: string | null; baseUrl?: string | null; model?: string | null }
  ): Promise<User> {
    requireAuthor(session);
    const data = await request<any>('/profile/ai-config', {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toUser(data);
  },

  async changePassword(
    session: Session,
    input: { currentPassword: string; newPassword: string }
  ): Promise<void> {
    requireAuthor(session);
    await request<any>('/profile/password', {
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
    const data = await request<any>(`/articles/${id}/request-restore`, {
      method: 'POST',
      token: session.token,
      body: { message: input?.message ?? null },
    });
    return {
      requestedAt: data.requestedAt ?? null,
      message: data.message ?? null,
    };
  },

  async confirmDeleteArticle(session: Session, id: string): Promise<void> {
    requireAuthor(session);
    await request<any>(`/articles/${id}/confirm-delete`, {
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
    const data = await request<any>(`/admin/articles/${id}/admin-meta`, {
      method: 'PATCH',
      token: session.token,
      body: input,
    });
    return toArticle(data);
  },
};
