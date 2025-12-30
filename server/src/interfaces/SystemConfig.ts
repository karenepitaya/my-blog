export type StatsTool = 'INTERNAL' | 'GA4' | 'UMAMI';

export type VisualEffectMode =
  | 'SNOW_FALL'
  | 'MATRIX_RAIN'
  | 'NEON_AMBIENT'
  | 'TERMINAL_GRID'
  | 'HEART_PARTICLES'
  | 'SCAN_LINES';

export type ThemeMode = 'single' | 'select' | 'light-dark-auto';

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
  defaultUserRole: 'admin' | 'author';
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

export interface SystemConfig {
  key?: string;
  admin: AdminConfig;
  frontend: FrontendSiteConfig;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
