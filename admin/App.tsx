
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, Article, Category, AuthState, ArticleStatus, CategoryStatus, SystemConfig } from './types';
import { INITIAL_CONFIG } from './constants';
import { ApiService } from './services/api';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ArticleList from './components/ArticleList';
import ArticleEditor from './components/ArticleEditor';
import CategoryMgmt from './components/CategoryMgmt';
import CategoryDetail from './components/CategoryDetail';
import RecycleBin from './components/RecycleBin';
import AuthorMgmt from './components/AuthorMgmt';
import TagCloud from './components/TagCloud';
import VisualFXEngine from './components/VisualFXEngine';
import StatsPanel from './components/StatsPanel';
import SystemSettings from './components/SystemSettings';
import AuthorSettings from './components/AuthorSettings';
import FXToggle from './components/FXToggle';
import { UploadService } from './services/upload';

const STORAGE_KEYS = {
  token: 'blog_token',
  user: 'blog_user',
};
const AUTH_EVENT = 'admin:unauthorized';

const normalizeConfig = (input: SystemConfig) => {
  const admin = input?.admin ?? INITIAL_CONFIG.admin;
  const frontend = input?.frontend ?? INITIAL_CONFIG.frontend;

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
  };
};

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, token: null, isLoading: true });
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  const [editingArticle, setEditingArticle] = useState<Article | 'NEW' | null>(null);
  const [draftCategoryId, setDraftCategoryId] = useState<string | null>(null);
  
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
    const init = async () => {
      const savedToken = localStorage.getItem(STORAGE_KEYS.token);
      const savedUser = localStorage.getItem(STORAGE_KEYS.user);

      if (!savedToken || !savedUser) {
        setAuth(prev => ({ ...prev, isLoading: false }));
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
        await refreshData(session, profile);
        await loadSystemConfig(session);
      } catch (err) {
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.removeItem(STORAGE_KEYS.user);
        setAuth({ user: null, token: null, isLoading: false });
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

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    setAuth({ user: null, token: null, isLoading: false });
    setArticles([]);
    setCategories([]);
    setUsers([]);
    setConfig(INITIAL_CONFIG);
    localStorage.removeItem('system_bios_config');
  };

  useEffect(() => {
    const onUnauthorized = () => {
      handleLogout();
    };
    window.addEventListener(AUTH_EVENT, onUnauthorized);
    return () => window.removeEventListener(AUTH_EVENT, onUnauthorized);
  }, []);

  const saveArticle = async (data: Partial<Article>) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    try {
      const current = data.id ? articles.find(item => item.id === data.id) : null;
      const wasPublished = current?.status === ArticleStatus.PUBLISHED;
      let article: Article;
      if (data.id) {
        article = await ApiService.updateArticle(session, data);
      } else {
        article = await ApiService.createArticle(session, data);
      }

      if (
        data.status === ArticleStatus.PUBLISHED &&
        article.status !== ArticleStatus.PUBLISHED &&
        !(auth.user.role === UserRole.AUTHOR && wasPublished)
      ) {
        article = await ApiService.publishArticle(session, article.id);
      } else if (data.status === ArticleStatus.DRAFT && article.status === ArticleStatus.EDITING) {
        article = await ApiService.saveDraft(session, article.id);
      }

      await refreshData(session, auth.user);
      setEditingArticle(null);
      setDraftCategoryId(null);
    } catch (err) {
      alert((err as Error).message);
    }
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

  const restoreResource = async (id: string, type: 'article' | 'user' | 'category') => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    if (type === 'article') {
      await ApiService.restoreArticle(session, id);
    } else if (type === 'category') {
      await ApiService.restoreCategory(session, id);
    } else {
      await ApiService.restoreAuthor(session, id);
    }
    await refreshData(session, auth.user);
  };

  const purgeResource = async (id: string, type: 'article' | 'user' | 'category') => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    if (type === 'article') {
      await ApiService.purgeArticle(session, id);
    } else if (type === 'category') {
      await ApiService.purgeCategory(session, id);
    } else {
      await ApiService.purgeAuthor(session, id);
    }
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

  const uploadCoverImage = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'article_cover');
    return result.url;
  };

  const uploadCategoryCover = async (file: File) => {
    if (!auth.user || !auth.token) {
      throw new Error('NOT_AUTHENTICATED');
    }
    const session = { token: auth.token, role: auth.user.role };
    const result = await UploadService.uploadImage(session, file, 'article_cover');
    return result.url;
  };

  const moveArticleCategory = async (id: string, categoryId: string | null) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    await ApiService.updateArticle(session, { id, categoryId });
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

  const updateProfile = async (input: { avatarUrl?: string | null; bio?: string | null }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    const updatedUser = await ApiService.updateProfile(session, input);
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    await refreshData(session, updatedUser);
  };

  const updateAiConfig = async (input: { apiKey?: string | null; baseUrl?: string | null; model?: string | null }) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    const updatedUser = await ApiService.updateAiConfig(session, input);
    setAuth(prev => ({ ...prev, user: updatedUser }));
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
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

  const handleEditArticle = async (article: Article) => {
    if (!auth.user || !auth.token) return;
    const session = { token: auth.token, role: auth.user.role };
    try {
      const detail = await ApiService.getArticleDetail(session, article.id);
      setEditingArticle(detail);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const startNewArticle = (categoryId?: string | null) => {
    setDraftCategoryId(categoryId ?? null);
    setEditingArticle('NEW');
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

  if (auth.isLoading) return <div className="h-screen bg-[#282a36] flex items-center justify-center text-[#bd93f9] font-mono text-xl animate-pulse">引导程序自检中...</div>;

  return (
    <HashRouter>
      {/* 全局特效库引擎：通过 Admin 配置决定模式，通过 FXToggle 决定开关 */}
      <VisualFXEngine mode={config.admin.activeEffectMode} enabled={fxEnabled} />
      
      {/* 全局特效开关：放置于此处以确保登录前后均可见 */}
      <FXToggle enabled={fxEnabled} onToggle={handleToggleFX} />

      {!auth.user ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Layout 
          user={auth.user} 
          onLogout={handleLogout} 
          users={users} 
        >
          <Routes>
            <Route path="/" element={<Dashboard user={auth.user} articles={articles} users={users} />} />
            <Route path="/stats" element={<StatsPanel />} />
            <Route path="/articles" element={
              editingArticle ? (
                <ArticleEditor 
                  article={editingArticle === 'NEW' ? undefined : editingArticle} 
                  categories={categories}
                  onSave={saveArticle}
                  onCancel={() => {
                    setEditingArticle(null);
                    setDraftCategoryId(null);
                  }}
                  onLoadTags={loadTags}
                  onCreateTag={createTag}
                  onUploadCover={uploadCoverImage}
                  defaultCategoryId={editingArticle === 'NEW' ? draftCategoryId ?? undefined : undefined}
                />
              ) : (
                <ArticleList 
                  articles={articles} 
                  categories={categories}
                  users={users}
                  user={auth.user} 
                  onEdit={handleEditArticle}
                  onCreate={() => startNewArticle()}
                  onDelete={deleteArticleWithOptions}
                  onPublish={publishArticle}
                  onRestore={restoreArticle}
                  onRequestRestore={requestArticleRestore}
                  onConfirmDelete={confirmDeleteArticle}
                  onUpdateAdminMeta={updateArticleAdminMeta}
                  onLoadDetail={loadArticleDetail}
                />
              )
            } />
            <Route
              path="/categories/:id"
              element={
                <CategoryDetail
                  categories={categories}
                  articles={articles}
                  user={auth.user}
                  onLoadDetail={loadCategoryDetail}
                  onSaveCategory={saveCategory}
                  onUploadCover={uploadCategoryCover}
                  onMoveArticle={moveArticleCategory}
                  onEditArticle={handleEditArticle}
                  onCreateArticle={startNewArticle}
                  onDeleteArticle={(id) => deleteArticleWithOptions(id)}
                />
              }
            />
            <Route
              path="/categories"
              element={
                <CategoryMgmt
                  categories={categories}
                  users={users}
                  user={auth.user}
                  onSave={saveCategory}
                  onDelete={deleteCategory}
                  onConfirmDelete={confirmDeleteCategory}
                  onRestore={restoreCategory}
                  onPurge={purgeCategory}
                  onUpdateAdminMeta={updateCategoryAdminMeta}
                  onLoadDetail={loadCategoryDetail}
                />
              }
            />
            <Route
              path="/tags"
              element={
                <TagCloud
                  articles={articles}
                  users={users}
                  user={auth.user}
                  onLoadTags={loadTags}
                  onCreateTag={createTag}
                  onDeleteTag={deleteTag}
                  onUpdateTag={updateTag}
                  onLoadDetail={loadTagDetail}
                />
              }
            />
            <Route
              path="/recycle-bin"
              element={
                <RecycleBin
                  articles={articles}
                  categories={categories}
                  users={users}
                  onRestore={restoreResource}
                  onPurge={purgeResource}
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
                  <SystemSettings config={config} onUpdate={updateSystemConfig} />
                ) : (
                  <AuthorSettings
                    user={auth.user}
                    onUpdateProfile={updateProfile}
                    onChangePassword={changePassword}
                    onUpdateAiConfig={updateAiConfig}
                    onUploadAvatar={uploadAvatarImage}
                  />
                )
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  );
};

export default App;
