import { ReactNode } from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
}

export interface StatMetric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'accent' | 'success';
}

export interface Article {
  id: string;
  title: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  category: string;
  views: number;
  date: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  ARTICLES = 'ARTICLES',
  SETTINGS = 'SETTINGS',
  TAGS = 'TAGS'
}

// --- New Types for Settings ---

export interface UserProfile {
  name: string;
  email: string;
  bio: string;
  role: string;
  emojiStatus: string;
  avatarUrl?: string;
}

export interface AIVendor {
  id: string;
  name: string;
  icon: ReactNode;
  color: string; // Hex for glow effects
  defaultBaseUrl: string;
}

export type SettingsTab = 'ACCOUNT' | 'AI_MODELS' | 'SECURITY';