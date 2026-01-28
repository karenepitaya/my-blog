
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { User, UserRole, Article, Category, AuthState, ArticleStatus, CategoryStatus, SystemConfig } from './types';
import { INITIAL_CONFIG } from './constants';
import { ApiService } from './services/api';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import { NeoAdminRuntimeProvider, type NeoAdminRuntime } from './components/NeoShared/runtime/NeoAdminRuntimeContext';
import { ArticleManager as NeoArticleManager } from './components/NeoArticles/ArticleManager';
import { AdminArticleManager as NeoAdminArticleManager } from './components/NeoArticles/AdminArticleManager';
import { CategoryManager as NeoCategoryManager } from './components/NeoCategories/CategoryManager';
import { AdminCategoryManager as NeoAdminCategoryManager } from './components/NeoCategories/AdminCategoryManager';
import { CategoryDetail as NeoCategoryDetail } from './components/NeoCategories/CategoryDetail';
import { AdminCategoryDetail as NeoAdminCategoryDetail } from './components/NeoCategories/AdminCategoryDetail';
import { NeoToastProvider } from './components/NeoShared/ui/Toast';
import EditorPage from './components/Editor/App';
import { AdminSystemLogs } from './components/NeoLogs/AdminSystemLogs';
import AuthorMgmt from './components/AuthorMgmt';
import TagCloud from './components/TagCloud';
import VisualFXEngine from './components/VisualFXEngine';
import StatsPanel from './components/StatsPanel';
import SystemSettings from './components/SystemSettings';
import AuthorSettings from './components/AuthorSettings';
import FXToggle from './components/FXToggle';
import { UploadService } from './services/upload';

type AiProxyMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AiProxyInput = {
  prompt?: string;
  messages?: AiProxyMessage[];
  temperature?: number;
  responseFormat?: 'json_object' | 'text';
};

type EditorSavePayload = {
  id?: string;
  status: ArticleStatus;
  title: string;
  markdown: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  tags: string[];
  categoryId?: string | null;
  slug?: string | null;
  uploadIds?: string[];
};

type EditorRouteProps = {
  auth: AuthState;
  categories: Category[];
  config: SystemConfig;
  onRefresh: () => Promise<void>;
  onProxyAiRequest: (input: AiProxyInput) => Promise<{ content: string }>;
};

const EditorRoute: React.FC<EditorRouteProps> = ({ auth, categories, config, onRefresh, onProxyAiRequest }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isAuthor = auth.user?.role === UserRole.AUTHOR;
  const aiModelName = auth.user?.preferences?.aiConfig?.model?.trim() || '';
  const aiPrompt = auth.user?.preferences?.aiConfig?.prompt ?? '';
  const aiConfigured = useMemo(() => {
    const config = auth.user?.preferences?.aiConfig;
    if (!config) return false;
    const hasApiKey = Boolean(config.apiKey && config.apiKey.trim());
    const hasModel = Boolean(config.model && config.model.trim());
    const hasBaseUrl = Boolean(config.baseUrl && config.baseUrl.trim());
    const hasVendor = Boolean(config.vendorId && config.vendorId.trim());
    return hasApiKey && hasModel && (hasBaseUrl || hasVendor);
  }, [auth.user]);

  const session = useMemo(() => {
    if (!auth.user || !auth.token) return null;
    return { token: auth.token, role: auth.user.role };
  }, [auth.user, auth.token]);

  const defaultCategoryId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('categoryId');
    return value ?? undefined;
  }, [location.search]);

  useEffect(() => {
    if (!session) return;
    if (!id) {
      setArticle(null);
      return;
    }
    let active = true;
    setIsLoading(true);
    ApiService.getArticleDetail(session, id)
      .then(data => {
        if (active) setArticle(data);
      })
      .catch(err => {
        if (active) {
          alert((err as Error).message);
          navigate(auth.user?.role === UserRole.ADMIN ? '/admin/articles' : '/articles');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, navigate, session]);

  const handleSaveToDb = async (input: EditorSavePayload) => {
    if (!session || !auth.user) throw new Error('NOT_AUTHENTICATED');
    const current = input.id ? article : null;
    const wasPublished = current?.status === ArticleStatus.PUBLISHED;
    let next: Article;
    if (input.id) {
      next = await ApiService.updateArticle(session, input);
    } else {
      next = await ApiService.createArticle(session, input);
    }

    if (
      input.status === ArticleStatus.PUBLISHED &&
      next.status !== ArticleStatus.PUBLISHED &&
      !(auth.user.role === UserRole.AUTHOR && wasPublished)
    ) {
      next = await ApiService.publishArticle(session, next.id);
    } else if (input.status === ArticleStatus.DRAFT && next.status === ArticleStatus.EDITING) {
      next = await ApiService.saveDraft(session, next.id);
    }

    setArticle(next);
    await onRefresh();
    return next;
  };

  if (!auth.user || !auth.token) return <Navigate to="/" replace />;

  if (isLoading) {
    return (
      <div className="admin-theme flex items-center justify-center min-h-screen bg-[var(--admin-ui-bg)] text-[#bd93f9] font-mono text-xl animate-pulse">
        编辑器加载中...
      </div>
    );
  }

  return (
    <EditorPage
      article={article}
      categories={categories}
      defaultCategoryId={defaultCategoryId}
      aiEnabled={config.admin.enableAiAssistant}
      isAuthor={isAuthor}
      aiConfigured={aiConfigured}
      aiModelName={aiModelName}
      aiPrompt={aiPrompt}
      autoSaveInterval={config.admin.autoSaveInterval}
      imageCompressionQuality={config.oss.imageCompressionQuality}
      onBack={() => {
        const path = auth.user?.role === UserRole.ADMIN ? '/admin/articles' : '/articles';
        window.location.hash = `#${path}`;
      }}
      onProxyAiRequest={onProxyAiRequest}
      onUploadCover={(file) => {
        if (!session) throw new Error('NOT_AUTHENTICATED');
        return UploadService.uploadImage(session, file, 'article_cover');
      }}
      onUploadInlineImage={(file) => {
        if (!session) throw new Error('NOT_AUTHENTICATED');
        return UploadService.uploadImage(session, file, 'misc');
      }}
      onSaveToDb={handleSaveToDb}
    />
  );
};

const FxToggleGate: React.FC<{ enabled: boolean; available: boolean; onToggle: (enabled: boolean) => void }> = ({
  enabled,
  available,
  onToggle,
}) => {
  const location = useLocation();
  if (!available) return null;
  if (location.pathname.startsWith('/editor')) return null;
  return <FXToggle enabled={enabled} onToggle={onToggle} />;
};

const LayoutRoute: React.FC<{
  user: User;
  users: User[];
  onLogout: () => void;
  impersonation: { adminToken: string; adminUser: User } | null;
  onExitImpersonation: () => void;
  onImpersonateAuthor?: (authorId: string, reason?: string) => Promise<void> | void;
}> = ({ user, users, onLogout, impersonation, onExitImpersonation, onImpersonateAuthor }) => (
  <NeoToastProvider>
    <Layout
      user={user}
      onLogout={onLogout}
      users={users}
      impersonation={impersonation}
      onExitImpersonation={onExitImpersonation}
      onImpersonateAuthor={onImpersonateAuthor}
    >
      <Outlet />
    </Layout>
  </NeoToastProvider>
);

const STORAGE_KEYS = {
  token: 'blog_token',
  user: 'blog_user',
  adminTokenBackup: 'blog_admin_token_backup',
  adminUserBackup: 'blog_admin_user_backup',
};
const AUTH_EVENT = 'admin:unauthorized';

const normalizeConfig = (input: SystemConfig) => {
  const admin = input?.admin ?? INITIAL_CONFIG.admin;
  const frontend = input?.frontend ?? INITIAL_CONFIG.frontend;
  const oss = input?.oss ?? INITIAL_CONFIG.oss;

  return {
    ...INITIAL_CONFIG,
    ...input,
    admin: {
      ...INITIAL_CONFIG.admin,
      ...admin,
      font: {
        ...INITIAL_CONFIG.admin.font,
        ...(admin as SystemConfig['admin']).font,
      },
    },
    frontend: {
      ...INITIAL_CONFIG.frontend,
      ...frontend,
    },
    oss: {
      ...INITIAL_CONFIG.oss,
      ...oss,
    },
  };
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null, isLoading: true });
  const [impersonation, setImpersonation] = useState<{ adminToken: string; adminUser: User } | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const allowImpersonation = import.meta.env.MODE !== 'production';
  const baseSeoRef = useRef<{ title: string } | null>(null);
  const [config, setConfig] = useState<SystemConfig>(() => {
    const saved = localStorage.getItem('system_bios_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.admin && parsed?.frontend) return normalizeConfig(parsed);
      } catch (err) {
        console.error('配置缓存解析失败', err);
      }
    }
    return normalizeConfig(INITIAL_CONFIG);
  });
  
  
  // FX 状态持久化：用户偏好特效开关
  const [fxEnabled, setFxEnabled] = useState(() => {
    const saved = localStorage.getItem('visual_fx_engine_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleFX = (enabled: boolean) => {
    setFxEnabled(enabled);
    localStorage.setItem('visual_fx_engine_enabled', String(enabled));
  };

  useEffect(() => {
    const face = config.admin.font?.face?.trim() || INITIAL_CONFIG.admin.font.face;
    const weight = config.admin.font?.weight?.trim() || INITIAL_CONFIG.admin.font.weight;
    document.documentElement.style.setProperty('--theme-font', face);
    document.documentElement.style.setProperty('--theme-font-weight', weight);
  }, [config.admin.font?.face, config.admin.font?.weight]);

  useEffect(() => {
    if (!baseSeoRef.current) {
      baseSeoRef.current = { title: document.title };
    }

    const enabled = Boolean((config.admin as any).enableEnhancedSeo);
    const head = document.head;

    const upsertMeta = (name: string, content: string) => {
      const trimmed = String(content ?? '').trim();
      const selector = `meta[data-admin-seo=\"1\"][name=\"${name}\"]`;
      const existing = head.querySelector(selector) as HTMLMetaElement | null;
      if (!enabled || !trimmed) {
        existing?.remove();
        return;
      }
      if (existing) {
        existing.content = trimmed;
        return;
      }
      const meta = document.createElement('meta');
      meta.setAttribute('data-admin-seo', '1');
      meta.name = name;
      meta.content = trimmed;
      head.appendChild(meta);
    };

    const upsertLinkRel = (rel: string, href: string) => {
      const next = String(href ?? '').trim();
      const selector = `link[data-admin-seo=\"1\"][rel=\"${rel}\"]`;
      const existing = head.querySelector(selector) as HTMLLinkElement | null;
      if (!enabled || !next) {
        existing?.remove();
        return;
      }
      if (existing) {
        existing.href = next;
        return;
      }
      const link = document.createElement('link');
      link.setAttribute('data-admin-seo', '1');
      link.rel = rel;
      link.href = next;
      head.appendChild(link);
    };

    if (!enabled) {
      document.title = baseSeoRef.current.title;
      head.querySelectorAll('meta[data-admin-seo=\"1\"]').forEach((node) => node.remove());
      head.querySelectorAll('link[data-admin-seo=\"1\"]').forEach((node) => node.remove());
      return;
    }

    const title =
      String((config.admin as any).adminTitle ?? '').trim() ||
      String(config.admin.siteName ?? '').trim() ||
      baseSeoRef.current.title;
    const description = String((config.admin as any).siteDescription ?? '').trim();
    const favicon = String((config.admin as any).adminFavicon ?? '').trim();

    document.title = title;

    upsertMeta('title', title);
    upsertMeta('description', description);
    upsertMeta('application-name', String(config.admin.siteName ?? '').trim());
    upsertMeta('apple-mobile-web-app-title', title);

    upsertLinkRel('icon', favicon);
    upsertLinkRel('shortcut icon', favicon);
    upsertLinkRel('apple-touch-icon', favicon);
  }, [config.admin]);

  useEffect(() => {
    const init = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEYS.token);
      const savedUser = localStorage.getItem(STORAGE_KEYS.user);
      const adminTokenBackup = localStorage.getItem(STORAGE_KEYS.adminTokenBackup);
      const adminUserBackupRaw = localStorage.getItem(STORAGE_KEYS.adminUserBackup);

      if (!savedToken || !savedUser) {
        setAuth(prev => ({ ...prev, isLoading: false }));
        setImpersonation(null);
        return;
      }

      try {
        const user = JSON.parse(savedUser) as User;
        const session = { token: savedToken, role: user.role };
        const profile =
          session.role === UserRole.ADMIN
            ? await ApiService.getAdminProfile(savedToken)
            : await ApiService.getAuthorProfile(savedToken);
        setAuth({ user: profile, token: savedToken, isLoading: false });
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));

        if (profile.role === UserRole.AUTHOR && adminTokenBackup && adminUserBackupRaw) {
          try {
            const adminUserBackup = JSON.parse(adminUserBackupRaw) as User;
            setImpersonation({ adminToken: adminTokenBackup, adminUser: adminUserBackup });
          } catch {
            localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
            localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
            setImpersonation(null);
          }
        } else {
          if (adminTokenBackup || adminUserBackupRaw) {
            localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
            localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
          }
          setImpersonation(null);
        }

        await refreshData(session, profile);
        await loadSystemConfig(session);
      } catch (err) {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
        localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
        setAuth({ user: null, token: null, isLoading: false });
        setImpersonation(null);
      }
    };
    init();
  }, []);

  const refreshData = async (session: { token: string; role: UserRole }, user: User) => {
    try {
      const categoryPromise =
        session.role === UserRole.ADMIN
          ? ApiService.getCategories(session)
          : Promise.all([
              ApiService.getCategories(session, { status: CategoryStatus.ACTIVE }),
              ApiService.getCategories(session, { status: CategoryStatus.PENDING_DELETE }),
            ]).then(([active, pending]) => [...active, ...pending]);

      const [artList, catList, userList] = await Promise.all([
        ApiService.getArticles(session),
        categoryPromise,
        session.role === UserRole.ADMIN ? ApiService.getUsers(session) : Promise.resolve([user]),
      ]);
      setArticles(artList);
      setCategories(catList);
      setUsers(userList);
    } catch (err) {
      console.error('数据同步失败', err);
    }
  };

  const handleLogin = async (user: User, token: string) => {
    localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
    localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
    setImpersonation(null);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    const session = { token, role: user.role };

    try {
      const profile =
        user.role === UserRole.ADMIN
          ? await ApiService.getAdminProfile(token)
          : await ApiService.getAuthorProfile(token);
      setAuth({ user: profile, token, isLoading: false });
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
      await refreshData(session, profile);
      await loadSystemConfig(session);
    } catch (err) {
      setAuth({ user, token, isLoading: false });
      await refreshData(session, user);
      await loadSystemConfig(session);
    }
  };

  const handleExitImpersonation = async () => {
    const adminTokenBackup = localStorage.getItem(STORAGE_KEYS.adminTokenBackup);
    const adminUserBackupRaw = localStorage.getItem(STORAGE_KEYS.adminUserBackup);
    if (!adminTokenBackup || !adminUserBackupRaw) return;

    let adminUserBackup: User;
    try {
      adminUserBackup = JSON.parse(adminUserBackupRaw) as User;
    } catch {
      localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
      localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
      setImpersonation(null);
      return;
    }

    localStorage.setItem(STORAGE_KEYS.token, adminTokenBackup);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(adminUserBackup));
    localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
    localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
    setImpersonation(null);

    try {
      const profile = await ApiService.getAdminProfile(adminTokenBackup);
      setAuth({ user: profile, token: adminTokenBackup, isLoading: false });
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(profile));
      await refreshData({ token: adminTokenBackup, role: UserRole.ADMIN }, profile);
      await loadSystemConfig({ token: adminTokenBackup, role: UserRole.ADMIN });
    } catch (err) {
      console.error('Exit impersonation profile refresh failed:', err);
      setAuth({ user: adminUserBackup, token: adminTokenBackup, isLoading: false });
    }
  };

  const handleImpersonateAuthor = async (authorId: string, reason?: string) => {
    if (!auth.user || !auth.token) throw new Error('NOT_AUTHENTICATED');
    if (auth.user.role !== UserRole.ADMIN) throw new Error('ADMIN_REQUIRED');

    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.impersonateAuthor(session, { authorId, reason });

    localStorage.setItem(STORAGE_KEYS.adminTokenBackup, auth.token);
    localStorage.setItem(STORAGE_KEYS.adminUserBackup, JSON.stringify(auth.user));
    setImpersonation({ adminToken: auth.token, adminUser: auth.user });

    localStorage.setItem(STORAGE_KEYS.token, result.token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(result.user));

    setAuth({ user: result.user, token: result.token, isLoading: false });
    await refreshData({ token: result.token, role: UserRole.AUTHOR }, result.user);
    await loadSystemConfig({ token: result.token, role: UserRole.AUTHOR });
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.adminTokenBackup);
    localStorage.removeItem(STORAGE_KEYS.adminUserBackup);
    setAuth({ user: null, token: null, isLoading: false });
    setImpersonation(null);
    setArticles([]);
    setCategories([]);
    setUsers([]);
    setConfig(INITIAL_CONFIG);
    localStorage.removeItem('system_bios_config');
  };

  useEffect(() => {
    const onUnauthorized = () => {
      const adminTokenBackup = localStorage.getItem(STORAGE_KEYS.adminTokenBackup);
      const adminUserBackup = localStorage.getItem(STORAGE_KEYS.adminUserBackup);
      if (adminTokenBackup && adminUserBackup) {
        void handleExitImpersonation();
        return;
      }
      handleLogout();
    };
    window.addEventListener(AUTH_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_EVENT, onUnauthorized);
  }, []);

  const openEditorRoute = (input?: { id?: string; categoryId?: string | null }) => {
    const id = input?.id;
    if (id) {
      window.location.hash = `#/editor/${id}`;
      return;
    }
    const categoryId = input?.categoryId;
    const search = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    window.location.hash = `#/editor${search}`;
  };

  const publishArticle = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.publishArticle(session, id);
    await refreshData(session, auth.user);
  };

  const unpublishArticle = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.unpublishArticle(session, id);
    await refreshData(session, auth.user);
  };

  const deleteArticleWithOptions = async (id: string, input?: { reason?: string | null; graceDays?: number }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.deleteArticle(session, id, input);
    await refreshData(session, auth.user);
  };

  const requestArticleRestore = async (id: string, message?: string | null) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.requestArticleRestore(session, id, { message });
    await refreshData(session, auth.user);
  };

  const restoreArticle = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.restoreArticle(session, id);
    await refreshData(session, auth.user);
  };

  const confirmDeleteArticle = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.confirmDeleteArticle(session, id);
    await refreshData(session, auth.user);
  };

  const updateArticleAdminMeta = async (id: string, input: { remark?: string | null }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.updateArticleAdminMeta(session, id, input);
    await refreshData(session, auth.user);
    return result;
  };

  const loadArticleDetail = async (id: string) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.getArticleDetail(session, id);
  };

  const restoreAuthor = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.restoreAuthor(session, id);
    await refreshData(session, auth.user);
  };

  const purgeAuthor = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.purgeAuthor(session, id);
    await refreshData(session, auth.user);
  };

  const saveCategory = async (data: Partial<Category>) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.saveCategory(session, data);
    await refreshData(session, auth.user);
  };

  const deleteCategory = async (id: string, input?: { graceDays?: number }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.deleteCategory(session, id, input);
    await refreshData(session, auth.user);
  };

  const confirmDeleteCategory = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.confirmDeleteCategory(session, id);
    await refreshData(session, auth.user);
  };

  const restoreCategory = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.restoreCategory(session, id);
    await refreshData(session, auth.user);
  };

  const purgeCategory = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.purgeCategory(session, id);
    await refreshData(session, auth.user);
  };

  const updateCategoryAdminMeta = async (id: string, input: { remark?: string | null }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.updateCategoryAdminMeta(session, id, input);
    await refreshData(session, auth.user);
    return result;
  };

  const loadCategoryDetail = async (id: string) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.getCategoryDetail(session, id);
  };

  const loadTags = async (options?: { page?: number; pageSize?: number }) => {
    if (!auth.user || !auth.token) return [];
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.getTags(session, options);
  };

  const createTag = async (input: {
    name: string;
    color?: string | null;
    effect?: 'glow' | 'pulse' | 'none';
    description?: string | null;
  }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    if (session.role === UserRole.ADMIN) {
      return ApiService.createAdminTag(session, input);
    }
    return ApiService.createTag(session, input);
  };

  const uploadCategoryCover = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'category_cover');
    return result.url;
  };

  const testOssUpload = async () => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const base64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO4BzWcAAAAASUVORK5CYII=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const file = new File([bytes], `oss-test-${Date.now()}.png`, { type: 'image/png' });
    const result = await UploadService.uploadImage(session, file, 'misc');
    return result.url;
  };

  const uploadFaviconImage = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'favicon');
    return result.url;
  };

  const uploadCharacterAvatarImage = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'character_avatar');
    return result.url;
  };

  const moveArticleCategory = async (id: string, categoryId: string | null) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.updateArticleCategory(session, id, categoryId);
    await refreshData(session, auth.user);
  };

  const deleteTag = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.deleteTag(session, id);
    await refreshData(session, auth.user);
  };

  const updateTag = async (
    id: string,
    input: { name?: string; color?: string | null; effect?: 'glow' | 'pulse' | 'none'; description?: string | null }
  ) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.updateTag(session, id, input);
    await refreshData(session, auth.user);
    return result;
  };

  const loadTagDetail = async (id: string) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.getTagDetail(session, id);
  };

  const updateProfile = async (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    const updatedUser = await ApiService.updateProfile(session, input);
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    await refreshData(session, updatedUser);
  };

  const updateAdminProfile = async (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => {
    if (!auth.user || !auth.token) return;
    if (auth.user.role !== UserRole.ADMIN) {
      throw new Error('ADMIN_REQUIRED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const updatedUser = await ApiService.updateAdminProfile(session, input);
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    await refreshData(session, updatedUser);
  };

  const updateAiConfig = async (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
    prompt?: string | null;
  }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    const updatedUser = await ApiService.updateAiConfig(session, input);
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
  };

  const fetchAiModels = async (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
  }) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.fetchAiModels(session, input);
  };

  const proxyAiRequest = async (input: AiProxyInput) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    if (auth.user.role !== UserRole.AUTHOR) {
      throw new Error('AUTHOR_REQUIRED');
    }
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.proxyAiRequest(session, input);
  };

  const changePassword = async (input: { currentPassword: string; newPassword: string }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.changePassword(session, input);
  };

  const uploadAvatarImage = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'avatar');
    return result.url;
  };

  const createAuthor = async (input: { username: string; password?: string }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.createAuthor(session, input);
    await refreshData(session, auth.user);
    return result;
  };

  const resetAuthor = async (id: string, input?: { reason?: string }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.resetAuthor(session, id, input);
    await refreshData(session, auth.user);
    return result;
  };

  const banAuthor = async (id: string, input?: { reason?: string }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.banAuthor(session, id, input);
    await refreshData(session, auth.user);
  };

  const unbanAuthor = async (id: string) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.unbanAuthor(session, id);
    await refreshData(session, auth.user);
  };

  const deleteAuthor = async (id: string, input?: { graceDays?: number }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.deleteAuthor(session, id, input);
    await refreshData(session, auth.user);
  };

  const updateUserAdminMeta = async (id: string, input: { remark?: string | null; tags?: string[] }) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const result = await ApiService.updateUserAdminMeta(session, id, input);
    await refreshData(session, auth.user);
    return result;
  };

  const loadUserDetail = async (id: string) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.getUserDetail(session, id);
  };

  

  const loadSystemConfig = async (session: { token: string; role: UserRole }) => {
    try {
      const nextConfig = await ApiService.getSystemConfig(session);
      const normalized = normalizeConfig(nextConfig);
      setConfig(normalized);
      localStorage.setItem('system_bios_config', JSON.stringify(normalized));
    } catch (err) {
      console.error('系统配置拉取失败', err);
    }
  };

  const updateSystemConfig = async (newConfig: SystemConfig) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const updated = await ApiService.updateSystemConfig(session, newConfig);
    const normalized = normalizeConfig(updated);
    setConfig(normalized);
    localStorage.setItem('system_bios_config', JSON.stringify(normalized));
    return normalized;
  };

  const publishSystemConfig = async (newConfig: SystemConfig) => {
    if (!auth.user || !auth.token) return null;
    const session = { token: auth.token, role: auth.user.role };
    const updated = await ApiService.publishSystemConfig(session, newConfig);
    const normalized = normalizeConfig(updated);
    setConfig(normalized);
    localStorage.setItem('system_bios_config', JSON.stringify(normalized));
    return normalized;
  };

  const previewThemeConfig = async (input: {
    themes: SystemConfig['frontend']['themes'];
    enableSeasonEffect?: boolean;
    seasonEffectType?: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
    seasonEffectIntensity?: number;
  }) => {
    if (!auth.user || !auth.token) return null;
    const enableDevPreview = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';
    if (!enableDevPreview) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.previewThemeConfig(session, input);
  };

  const previewAllSystemConfig = async (input: SystemConfig) => {
    if (!auth.user || !auth.token) return null;
    const enableDevPreview = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';
    if (!enableDevPreview) return null;
    const session = { token: auth.token, role: auth.user.role };
    return ApiService.previewAllSystemConfig(session, input);
  };

  const refreshDataForAuth = async () => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await refreshData(session, auth.user);
  };

  if (auth.isLoading) return <div className="h-screen bg-[var(--admin-ui-bg)] flex items-center justify-center text-[#bd93f9] font-mono text-xl animate-pulse">引导程序自检中...</div>;

  const buildAuthorNeoRuntime = (): NeoAdminRuntime => ({
    user: auth.user!,
    session: { token: auth.token!, role: auth.user!.role },
    articles,
    categories,
    users,
    openEditorRoute,
    publishArticle,
    unpublishArticle,
    deleteArticle: deleteArticleWithOptions,
    restoreArticle,
    requestArticleRestore,
    confirmDeleteArticle,
    updateArticleAdminMeta: async () => {},
    loadArticleDetail,
    saveCategory,
    deleteCategory,
    restoreCategory,
    confirmDeleteCategory,
    purgeCategory: async () => {
      throw new Error('ADMIN_REQUIRED');
    },
    updateCategoryAdminMeta: async () => {
      throw new Error('ADMIN_REQUIRED');
    },
    loadCategoryDetail,
    uploadCategoryCover,
    moveArticleCategory,
    refresh: refreshDataForAuth,
  });

  const buildAdminNeoRuntime = (): NeoAdminRuntime => ({
    user: auth.user!,
    session: { token: auth.token!, role: auth.user!.role },
    articles,
    categories,
    users,
    openEditorRoute: () => {},
    publishArticle: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    unpublishArticle,
    deleteArticle: deleteArticleWithOptions,
    restoreArticle,
    requestArticleRestore: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    confirmDeleteArticle: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    updateArticleAdminMeta: async (id, input) => {
      await updateArticleAdminMeta(id, input);
    },
    loadArticleDetail,
    saveCategory: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    deleteCategory,
    restoreCategory,
    confirmDeleteCategory: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    purgeCategory,
    updateCategoryAdminMeta: async (id, input) => {
      await updateCategoryAdminMeta(id, input);
    },
    loadCategoryDetail,
    uploadCategoryCover: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    moveArticleCategory: async () => {
      throw new Error('AUTHOR_REQUIRED');
    },
    refresh: refreshDataForAuth,
  });

  const ArticlesRoute: React.FC = () => {
    const location = useLocation();
    if (!auth.user) return <Navigate to="/" replace />;

    if (auth.user.role === UserRole.ADMIN) {
      return <Navigate to={`/admin/articles${location.search}`} replace />;
    }

    const params = new URLSearchParams(location.search);
    if (params.has('authorId')) {
      params.delete('authorId');
      const search = params.toString();
      return <Navigate to={`/articles${search ? `?${search}` : ''}`} replace />;
    }

    return (
      <NeoAdminRuntimeProvider value={buildAuthorNeoRuntime()}>
        <NeoArticleManager />
      </NeoAdminRuntimeProvider>
      );
  };

  const AdminArticlesRoute: React.FC = () => {
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role !== UserRole.ADMIN) return <Navigate to="/articles" replace />;

    return (
      <NeoAdminRuntimeProvider value={buildAdminNeoRuntime()}>
        <NeoAdminArticleManager />
      </NeoAdminRuntimeProvider>
      );
  };

  const CategoriesRoute: React.FC = () => {
    const location = useLocation();
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role === UserRole.ADMIN) {
      return <Navigate to={`/admin/categories${location.search}`} replace />;
    }
    return (
      <NeoAdminRuntimeProvider value={buildAuthorNeoRuntime()}>
        <NeoCategoryManager />
      </NeoAdminRuntimeProvider>
    );
  };

  const CategoryDetailRoute: React.FC = () => {
    const location = useLocation();
    const { id } = useParams();
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role === UserRole.ADMIN) {
      return <Navigate to={`/admin/categories/${id}${location.search}`} replace />;
    }
    return (
      <NeoAdminRuntimeProvider value={buildAuthorNeoRuntime()}>
        <NeoCategoryDetail />
      </NeoAdminRuntimeProvider>
    );
  };

  const AdminCategoriesRoute: React.FC = () => {
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role !== UserRole.ADMIN) return <Navigate to="/categories" replace />;
    return (
      <NeoAdminRuntimeProvider value={buildAdminNeoRuntime()}>
        <NeoAdminCategoryManager />
      </NeoAdminRuntimeProvider>
    );
  };

  const AdminCategoryDetailRoute: React.FC = () => {
    const { id } = useParams();
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role !== UserRole.ADMIN) return <Navigate to={`/categories/${id}`} replace />;
    return (
      <NeoAdminRuntimeProvider value={buildAdminNeoRuntime()}>
        <NeoAdminCategoryDetail />
      </NeoAdminRuntimeProvider>
    );
  };

  const AdminLogsRoute: React.FC = () => {
    if (!auth.user) return <Navigate to="/" replace />;
    if (auth.user.role !== UserRole.ADMIN) return <Navigate to="/" replace />;
    return <AdminSystemLogs />;
  };

  return (
    <HashRouter>
      {/* 全局特效库引擎：通过 Admin 配置决定模式，通过 FXToggle 决定开关 */}
      <VisualFXEngine
        mode={config.admin.activeEffectMode}
        enabled={fxEnabled && (config.admin as any).enableBgEffect !== false}
        intensity={(config.admin as any).effectIntensity}
      />
      
      {/* 全局特效开关：放置于此处以确保登录前后均可见 */}
      <FxToggleGate
        enabled={fxEnabled}
        available={(config.admin as any).enableBgEffect !== false}
        onToggle={handleToggleFX}
      />

      {!auth.user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Routes>
          <Route
            path="/editor"
            element={
              <EditorRoute
                auth={auth}
                categories={categories}
                config={config}
                onRefresh={refreshDataForAuth}
                onProxyAiRequest={proxyAiRequest}
              />
            }
          />
          <Route
            path="/editor/:id"
            element={
              <EditorRoute
                auth={auth}
                categories={categories}
                config={config}
                onRefresh={refreshDataForAuth}
                onProxyAiRequest={proxyAiRequest}
              />
            }
          />
          <Route
            element={
              <LayoutRoute
                user={auth.user}
                 users={users}
                 onLogout={handleLogout}
                 impersonation={impersonation}
                 onExitImpersonation={handleExitImpersonation}
                 onImpersonateAuthor={allowImpersonation ? handleImpersonateAuthor : undefined}
               />
             }
           >
            <Route path="/" element={<Dashboard user={auth.user} articles={articles} users={users} />} />
            <Route path="/stats" element={<StatsPanel user={auth.user!} token={auth.token} />} />
             <Route
               path="/articles"
               element={<ArticlesRoute />}
             />
             <Route path="/admin/articles" element={<AdminArticlesRoute />} />
             <Route path="/categories" element={<CategoriesRoute />} />
            <Route path="/categories/:id" element={<CategoryDetailRoute />} />
            <Route path="/admin/categories" element={<AdminCategoriesRoute />} />
            <Route path="/admin/categories/:id" element={<AdminCategoryDetailRoute />} />
            <Route path="/admin/logs" element={<AdminLogsRoute />} />
            <Route
              path="/tags"
              element={
                <TagCloud
                  articles={articles}
                  users={users}
                  user={auth.user}
                  frontendSiteUrl={config.frontend.site}
                  onLoadTags={loadTags}
                  onCreateTag={createTag}
                  onDeleteTag={deleteTag}
                  onUpdateTag={updateTag}
                  onLoadDetail={loadTagDetail}
                />
              }
            />
            {auth.user.role === UserRole.ADMIN && (
              <Route
                path="/users"
                element={
                  <AuthorMgmt
                    users={users}
                    onCreate={createAuthor}
                    onReset={resetAuthor}
                    onBan={banAuthor}
                    onUnban={unbanAuthor}
                    onDelete={deleteAuthor}
                    onRestore={restoreAuthor}
                    onPurge={purgeAuthor}
                    onUpdateAdminMeta={updateUserAdminMeta}
                    onLoadDetail={loadUserDetail}
                  />
                }
              />
            )}
            <Route
              path="/settings"
              element={
                auth.user.role === UserRole.ADMIN ? (
                  <SystemSettings
                    token={auth.token!}
                    user={auth.user}
                    config={config}
                    onUpdate={updateSystemConfig}
                    onPublish={publishSystemConfig}
                    onPreviewTheme={previewThemeConfig}
                    onPreviewAll={previewAllSystemConfig}
                    onUpdateProfile={updateAdminProfile}
                    onUploadFavicon={uploadFaviconImage}
                    onUploadCharacterAvatar={uploadCharacterAvatarImage}
                    onUploadAvatar={uploadAvatarImage}
                    onTestOssUpload={testOssUpload}
                  />
                ) : (
                  <AuthorSettings
                    user={auth.user}
                    onUpdateProfile={updateProfile}
                    onChangePassword={changePassword}
                    onUpdateAiConfig={updateAiConfig}
                    onUploadAvatar={uploadAvatarImage}
                    onFetchAiModels={fetchAiModels}
                  />
                )
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;
