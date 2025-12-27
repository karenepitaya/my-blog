
import React from 'react';
import { SystemConfig, UserRole, VisualEffectMode } from './types';

export const INITIAL_CONFIG: SystemConfig = {
  admin: {
    adminEmail: 'root@dracula.io',
    systemId: 'MT-CORE-X1',
    siteName: 'MultiTerm 多人博客系统',
    siteDescription: '一款专为极客设计的终端审美多人博客管理平台，深度集成 Dracula Soft 主题。',
    maintenanceMode: false,
    dashboardRefreshRate: 5000,
    showQuickDraft: true,
    enableAiAssistant: true,
    autoSaveInterval: 30,
    allowAuthorCustomCategories: true,
    statsApiEndpoint: '/api/v1/metrics',
    statsTool: 'INTERNAL',
    allowRegistration: true,
    defaultUserRole: UserRole.AUTHOR,
    recycleBinRetentionDays: 30,
    activeEffectMode: VisualEffectMode.SNOW_FALL,
  },
  frontend: {
    site: 'https://blog.karenepitaya.xyz',
    title: "Karene's Blog",
    description: 'A multi-author blog powered by our server public API',
    author: 'Karene Pitayas',
    tags: ['Astro', 'MultiTerm', 'Blog', 'karenepitaya'],
    socialCardAvatarImage: './src/content/avatar.jpg',
    font: 'JetBrains Mono Variable',
    pageSize: 6,
    trailingSlashes: false,
    navLinks: [
      {
        name: 'Home',
        url: '/',
      },
      {
        name: 'About',
        url: '/about',
      },
      {
        name: 'Archive',
        url: '/posts',
      },
      {
        name: 'GitHub',
        url: 'https://github.com/karenepitaya',
        external: true,
      },
    ],
    themes: {
      mode: 'select',
      default: 'catppuccin-mocha',
      include: [
        'andromeeda',
        'aurora-x',
        'ayu-dark',
        'catppuccin-frappe',
        'catppuccin-latte',
        'catppuccin-macchiato',
        'catppuccin-mocha',
        'dark-plus',
        'dracula',
        'dracula-soft',
        'everforest-dark',
        'everforest-light',
        'github-dark',
        'github-dark-default',
        'github-dark-dimmed',
        'github-dark-high-contrast',
        'github-light',
        'github-light-default',
        'github-light-high-contrast',
        'gruvbox-dark-hard',
        'gruvbox-dark-medium',
        'gruvbox-dark-soft',
        'gruvbox-light-hard',
        'gruvbox-light-medium',
        'gruvbox-light-soft',
        'houston',
        'kanagawa-dragon',
        'kanagawa-lotus',
        'kanagawa-wave',
        'laserwave',
        'light-plus',
        'material-theme',
        'material-theme-darker',
        'material-theme-lighter',
        'material-theme-ocean',
        'material-theme-palenight',
        'min-dark',
        'min-light',
        'monokai',
        'night-owl',
        'nord',
        'one-dark-pro',
        'one-light',
        'plastic',
        'poimandres',
        'red',
        'rose-pine',
        'rose-pine-moon',
        'rose-pine-dawn',
        'slack-dark',
        'slack-ochin',
        'snazzy-light',
        'solarized-dark',
        'solarized-light',
        'synthwave-84',
        'tokyo-night',
        'vesper',
        'vitesse-black',
        'vitesse-dark',
        'vitesse-light',
      ],
      overrides: {},
    },
    socialLinks: {
      github: 'https://github.com/karenepitaya',
      mastodon: 'https://github.com/karenepitaya',
      email: 'https://github.com/karenepitaya',
      linkedin: 'https://github.com/karenepitaya',
      bluesky: 'https://github.com/karenepitaya',
      twitter: 'https://github.com/karenepitaya',
    },
    giscus: undefined,
    characters: {
      owl: '/owl.webp',
      unicorn: '/unicorn.webp',
      duck: '/duck.webp',
    },
  },
};

export const UI_COLORS = {
  bg: '#282a36',
  card: '#21222c',
  border: '#44475a',
  accent: '#bd93f9',
  accentMuted: '#6272a4',
  text: '#f8f8f2',
  textMuted: '#6272a4',
  danger: '#ff5545',
  success: '#50fa7b',
  warning: '#f1fa8c',
  info: '#8be9fd',
};

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-5 h-5 flex items-center justify-center shrink-0">
    <div className="w-full h-full">
      {children}
    </div>
  </div>
);

export const Icons = {
  Dashboard: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
    </IconWrapper>
  ),
  Stats: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    </IconWrapper>
  ),
  Articles: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M14 4v4h4" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h3M7 12h10M7 16h10" /></svg>
    </IconWrapper>
  ),
  Users: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 01-9-3.47m0-3.513A5.993 5.993 0 0115 11a5.993 5.993 0 012.146" /></svg>
    </IconWrapper>
  ),
  Categories: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
    </IconWrapper>
  ),
  Tags: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7h7l8 8-9 9H5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    </IconWrapper>
  ),
  Recycle: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </IconWrapper>
  ),
  Settings: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    </IconWrapper>
  ),
  Logout: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
    </IconWrapper>
  ),
  Plus: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
    </IconWrapper>
  ),
  Edit: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
    </IconWrapper>
  ),
  Check: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
    </IconWrapper>
  ),
  Trash: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </IconWrapper>
  ),
  Restore: () => (
    <IconWrapper>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
    </IconWrapper>
  )
};
