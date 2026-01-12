import React, { createContext, useContext } from 'react';
import type { Article, Category, User, UserRole } from '../../../types';

export type NeoAdminRuntimeSession = {
  token: string;
  role: UserRole;
};

export type NeoAdminRuntime = {
  user: User;
  session: NeoAdminRuntimeSession;
  articles: Article[];
  categories: Category[];
  users: User[];
  openEditorRoute: (input?: { id?: string; categoryId?: string | null }) => void;
  publishArticle: (id: string) => Promise<void>;
  unpublishArticle: (id: string) => Promise<void>;
  deleteArticle: (id: string, input?: { reason?: string | null; graceDays?: number }) => Promise<void>;
  restoreArticle: (id: string) => Promise<void>;
  requestArticleRestore: (id: string, message?: string | null) => Promise<void>;
  confirmDeleteArticle: (id: string) => Promise<void>;
  updateArticleAdminMeta: (id: string, input: { remark?: string | null }) => Promise<void>;
  loadArticleDetail: (id: string) => Promise<Article | null>;

  // Categories (a.k.a. "columns")
  saveCategory: (input: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string, input?: { graceDays?: number }) => Promise<void>;
  restoreCategory: (id: string) => Promise<void>;
  confirmDeleteCategory: (id: string) => Promise<void>;
  purgeCategory: (id: string) => Promise<void>;
  updateCategoryAdminMeta: (id: string, input: { remark?: string | null }) => Promise<void>;
  loadCategoryDetail: (id: string) => Promise<Category | null>;
  uploadCategoryCover: (file: File) => Promise<string>;
  moveArticleCategory: (articleId: string, categoryId: string | null) => Promise<void>;
  refresh: () => Promise<void>;
};

const NeoAdminRuntimeContext = createContext<NeoAdminRuntime | null>(null);

export const NeoAdminRuntimeProvider: React.FC<{ value: NeoAdminRuntime; children: React.ReactNode }> = ({
  value,
  children,
}) => <NeoAdminRuntimeContext.Provider value={value}>{children}</NeoAdminRuntimeContext.Provider>;

export const useNeoAdminRuntime = (): NeoAdminRuntime => {
  const ctx = useContext(NeoAdminRuntimeContext);
  if (!ctx) {
    throw new Error('NeoAdminRuntimeProvider is missing');
  }
  return ctx;
};

export const useNeoAdminRuntimeOptional = (): NeoAdminRuntime | null => useContext(NeoAdminRuntimeContext);
