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

export interface FrontendSiteConfig {
  siteName: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  faviconUrl: string;
  themeMode: 'single' | 'day-night';
  themeDefault: string;
  themeDark?: string;
  enableSeasonEffect: boolean;
  seasonEffectType: 'sakura' | 'snow' | 'leaves' | 'none';
  enableGiscus: boolean;
  giscusRepo?: string;
  giscusCategory?: string;
  enableCharacters: boolean;
  activeCharacters: CharacterConfig[];
  enableAuthorCard: boolean;
  authorCardStyle: 'minimal' | 'detailed';
  pageSize: number;
  enableRecommendations: boolean;
  recommendationMode: 'tag' | 'date' | 'category' | 'random';
  navLinks: NavLinkConfig[];
  socialLinks: SocialLinkConfig[];
  siteMode: 'normal' | 'maintenance';
}

export interface AdminSystemConfig {
  enableEnhancedSeo: boolean;
  adminTitle: string;
  adminFavicon: string;
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
