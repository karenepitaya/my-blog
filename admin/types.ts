export enum UserRole {
  ADMIN = 'admin',
  AUTHOR = 'author',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BANNED = 'BANNED',
  PENDING_DELETE = 'PENDING_DELETE',
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  EDITING = 'EDITING',
  PUBLISHED = 'PUBLISHED',
  PENDING_DELETE = 'PENDING_DELETE',
}

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  PENDING_DELETE = 'PENDING_DELETE',
}

export enum VisualEffectMode {
  SNOW_FALL = 'SNOW_FALL',
  MATRIX_RAIN = 'MATRIX_RAIN',
  NEON_AMBIENT = 'NEON_AMBIENT',
  TERMINAL_GRID = 'TERMINAL_GRID',
  HEART_PARTICLES = 'HEART_PARTICLES',
  SCAN_LINES = 'SCAN_LINES',
}

export type ThemeMode = 'single' | 'select' | 'light-dark-auto';

export interface AuthorPreferences {
  articlePageSize?: number;
  recycleBinRetention?: number;
  statsLayout?: string;
  aiConfig?: {
    vendorId?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    prompt?: string;
  };
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  isActive?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  displayName?: string | null;
  email?: string | null;
  roleTitle?: string | null;
  emojiStatus?: string | null;
  bannedAt?: string | null;
  bannedReason?: string | null;
  deleteScheduledAt?: string | null;
  adminRemark?: string | null;
  adminTags?: string[];
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string | null;
  preferences?: AuthorPreferences;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  ownerId?: string | null;
  status?: CategoryStatus;
  deletedAt?: string | null;
  deletedByRole?: UserRole | 'author' | 'admin' | null;
  deletedBy?: string | null;
  deleteScheduledAt?: string | null;
  adminRemark?: string | null;
  articleCount?: number;
  views?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  articleCount?: number;
  color?: string | null;
  effect?: 'glow' | 'pulse' | 'none';
  description?: string | null;
}

export interface Article {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  tags: string[];
  categoryId?: string | null;
  status: ArticleStatus;
  views: number;
  firstPublishedAt?: string | null;
  publishedAt?: string | null;
  deletedAt?: string | null;
  deletedByRole?: UserRole | 'author' | 'admin' | null;
  deletedBy?: string | null;
  deleteScheduledAt?: string | null;
  deleteReason?: string | null;
  restoreRequestedAt?: string | null;
  restoreRequestedMessage?: string | null;
  adminRemark?: string | null;
  createdAt: string;
  updatedAt: string;
  markdown?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export type StatsTool = 'INTERNAL' | 'GA4' | 'UMAMI';

export interface AdminFontConfig {
  face: string;
  weight: string;
}

export interface AdminConfig {
  adminEmail: string;
  systemId: string;
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  dashboardRefreshRate: number;
  showQuickDraft: boolean;
  enableAiAssistant: boolean;
  autoSaveInterval: number;
  allowAuthorCustomCategories: boolean;
  statsApiEndpoint: string;
  statsTool: StatsTool;
  allowRegistration: boolean;
  defaultUserRole: UserRole;
  recycleBinRetentionDays: number;
  activeEffectMode: VisualEffectMode;
  font: AdminFontConfig;
}

export interface NavLink {
  name: string;
  url: string;
  external?: boolean;
}

export interface ThemesConfig {
  default: string;
  mode: ThemeMode;
  include: string[];
  overrides?: Record<string, Record<string, string>>;
}

export interface SocialLinks {
  github?: string;
  twitter?: string;
  mastodon?: string;
  bluesky?: string;
  linkedin?: string;
  email?: string;
}

export interface GiscusConfig {
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  reactionsEnabled: boolean;
}

export interface FrontendSiteConfig {
  site: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  faviconUrl: string;
  socialCardAvatarImage: string;
  font: string;
  pageSize: number;
  trailingSlashes: boolean;
  navLinks: NavLink[];
  themes: ThemesConfig;
  socialLinks: SocialLinks;
  giscus?: GiscusConfig;
  characters: Record<string, string>;
}

export type OssProvider = 'oss' | 'minio';

export interface OssConfig {
  enabled: boolean;
  provider: OssProvider;
  endpoint?: string;
  bucket?: string;
  accessKey?: string;
  secretKey?: string;
  region?: string;
  customDomain?: string;
  uploadPath?: string;
  imageCompressionQuality?: number;
}

export interface SystemConfig {
  admin: AdminConfig;
  frontend: FrontendSiteConfig;
  oss: OssConfig;
}
