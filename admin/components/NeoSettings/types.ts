import type { ReactNode } from 'react';

export interface NavLinkConfig {
  id: string;
  label: string;
  path: string;
  enableExternal: boolean;
  visible: boolean;
}

export interface SocialLinkConfig {
  id: string;
  platform: string;
  url: string;
  visible: boolean;
}

export interface CharacterConfig {
  id: string;
  name: string;
  avatar: string;
  enable: boolean;
}

export interface MaintenanceInfoConfig {
  startAt: string;
  endAt: string;
  reason: string;
}

export interface FrontendSiteConfig {
  siteUrl: string;
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteAuthor: string;
  faviconUrl: string;
  socialCardAvatarImage: string;
  themeMode: 'single' | 'day-night' | 'select';
  themeDefault: string;
  themeDark?: string;
  themeInclude: string[];
  enableSeasonEffect: boolean;
  seasonEffectType: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
  seasonEffectIntensity: number;
  enableAnniversaryEffect: boolean;
  enableGiscus: boolean;
  giscusRepo?: string;
  giscusCategory?: string;
  enableCharacters: boolean;
  activeCharacters: CharacterConfig[];
  enableAboutAuthorCard: boolean;
  enableFooterAuthorCard: boolean;
  authorCardStyle: 'minimal' | 'detailed';
  pageSize: number;
  homePageSize: number;
  archivePageSize: number;
  categoryPageSize: number;
  tagPageSize: number;
  enableRecommendations: boolean;
  recommendationMode: 'tag' | 'date' | 'category' | 'random';
  recommendationCount: number;
  navLinks: NavLinkConfig[];
  socialLinks: SocialLinkConfig[];
  siteMode: 'normal' | 'maintenance';
  maintenance: MaintenanceInfoConfig;
}

export interface AdminSystemConfig {
  enableEnhancedSeo: boolean;
  adminTitle: string;
  adminFavicon: string;
  adminDescription: string;
  enableBgEffect: boolean;
  activeEffectMode: 'SNOW_FALL' | 'MATRIX_RAIN' | 'NEON_AMBIENT' | 'TERMINAL_GRID' | 'HEART_PARTICLES' | 'SCAN_LINES';
  effectIntensity: number;
  recycleBinRetentionDays: number;
  autoSaveInterval: number;
  previewLoadCover: boolean;
  enableImgCompression: boolean;
  maintenanceMode: boolean;
}

export interface DatabaseConfig {
  host: string;
  port: number | string;
  username: string;
  password?: string;
  dbname: string;
  enableStatusCollection: boolean;
}

export interface ServerRuntimeConfig {
  port: number;
  enableSecurityFilter: boolean;
  enableGzip: boolean;
}

export interface OSSConfig {
  provider: 'minio' | 'oss';
  endpoint: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
  region: string;
  customDomain: string;
}

export interface AnalyticsConfig {
  tool: 'INTERNAL' | 'GA4' | 'UMAMI' | 'BAIDU';
  apiEndpoint?: string;
  siteId?: string;
}

export interface LogConfig {
  storagePath: string;
  retentionDays: number;
  collectionInterval: number;
}

export interface AIVendor {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  defaultBaseUrl: string;
}

export interface UserProfile {
  username: string;
  displayName: string;
  email: string;
  roleTitle: string;
  emojiStatus: string;
  bio: string;
  avatarUrl: string;
}
