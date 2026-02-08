import type { UserRole } from '../shared/enums';

export type StatsTool = 'INTERNAL' | 'GA4' | 'UMAMI';

export type VisualEffectMode =
  | 'SNOW_FALL'
  | 'MATRIX_RAIN'
  | 'NEON_AMBIENT'
  | 'TERMINAL_GRID'
  | 'HEART_PARTICLES'
  | 'SCAN_LINES';

export type ThemeMode = 'single' | 'select' | 'light-dark-auto';
export type OssProvider = 'oss' | 'minio';

export type SeasonEffectType = 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
export type AuthorCardStyle = 'minimal' | 'detailed';
export type RecommendationMode = 'tag' | 'date' | 'category' | 'random';

export interface CharacterConfigItem {
  id: string;
  name: string;
  avatar: string;
  enable: boolean;
}

export interface MaintenanceInfo {
  startAt: string;
  endAt: string;
  reason: string;
}

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
  enableEnhancedSeo?: boolean;
  adminTitle?: string;
  adminFavicon?: string;
  enableBgEffect?: boolean;
  effectIntensity?: number;
  previewLoadCover?: boolean;
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
  homePageSize?: number;
  archivePageSize?: number;
  categoryPageSize?: number;
  tagPageSize?: number;
  trailingSlashes: boolean;
  navLinks: NavLink[];
  themes: ThemesConfig;
  socialLinks: SocialLinks;
  giscus?: GiscusConfig;
  characters: Record<string, string>;
  enableSeasonEffect?: boolean;
  seasonEffectType?: SeasonEffectType;
  seasonEffectIntensity?: number;
  enableAnniversaryEffect?: boolean;
  // CONTRACT: Legacy switch gates About + footer cards when new switches are absent.
  enableAuthorCard?: boolean;
  enableAboutAuthorCard?: boolean;
  enableFooterAuthorCard?: boolean;
  authorCardStyle?: AuthorCardStyle;
  enableRecommendations?: boolean;
  recommendationMode?: RecommendationMode;
  recommendationCount?: number;
  enableCharacters?: boolean;
  activeCharacters?: CharacterConfigItem[];
  siteMode?: 'normal' | 'maintenance';
  maintenance?: MaintenanceInfo;
}

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
  key?: string;
  admin: AdminConfig;
  frontend: FrontendSiteConfig;
  oss: OssConfig;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
