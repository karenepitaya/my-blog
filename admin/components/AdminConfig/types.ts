
import { ReactNode } from 'react';

// --- Core UI Types ---
export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

// --- Dashboard & Metrics ---
export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  subValue?: string; // For extra context like "Indexed: 100%"
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode; // Note: In a real API, this might be a string key mapped to an icon
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | string;
}

// --- Content Management ---
export interface Article {
  id: string;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  category: string;
  views: number;
  date: string;
}

// --- Analytics Data Models ---
export interface TrendDataPoint {
  name: string; // X-Axis label (e.g., "Mon", "10:00")
  [key: string]: string | number; // Dynamic values for lines/bars (uv, pv, etc.)
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface ResourceProcess {
  pid: number;
  name: string;
  type: string;
  cpu: number;
  mem: number;
  status: 'online' | 'offline' | 'error';
}

export interface CollectionStat {
  name: string;
  count: number;
  sizeMB: number;
  color: string;
}

// --- App State Types ---
export enum ViewMode {
  ADMIN_ANALYTICS = 'ADMIN_ANALYTICS',
  AUTHOR_ANALYTICS = 'AUTHOR_ANALYTICS',
  SETTINGS = 'SETTINGS',
  AUTHOR_SETTINGS = 'AUTHOR_SETTINGS',
  SYSTEM_LOGS = 'SYSTEM_LOGS',
  MOCK_PANEL = 'MOCK_PANEL',
  ICONS_LIBRARY = 'ICONS_LIBRARY'
}

// --- System Log Types ---
export type LogScope = 'FRONTEND' | 'BACKEND' | 'SERVER';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export interface LogEntry {
  id: number;
  timestamp: string;
  scope: LogScope;
  level: LogLevel;
  source: string;
  message: string;
  traceId: string;
}

// --- Settings Types ---
export type SettingsTab = 'PROFILE' | 'SYSTEM' | 'INFRA';
export type AuthorSettingsTab = 'PROFILE' | 'AI_CONFIG' | 'SECURITY';

export interface UserProfile {
  username: string; 
  displayName: string;
  email: string;
  roleTitle: string;
  emojiStatus: string;
  bio: string;
  avatarUrl: string;
}

export interface AIVendor {
  id: string;
  name: string;
  icon: ReactNode;
  color: string;
  defaultBaseUrl: string;
}

// --- Configuration Types (Frontend/Backend) ---
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
