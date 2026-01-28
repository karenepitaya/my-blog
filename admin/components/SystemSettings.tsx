import React from 'react';
import type { SystemConfig } from '../types';
import type { User } from '../types';
import AdminSettings from './NeoSettings/AdminSettings';

interface SystemSettingsProps {
  token: string;
  user: User;
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onPublish: (config: SystemConfig) => Promise<SystemConfig | null>;
  onPreviewTheme: (input: {
    themes: SystemConfig['frontend']['themes'];
    enableSeasonEffect?: boolean;
    seasonEffectType?: 'sakura' | 'snow' | 'leaves' | 'fireflies' | 'anniversary' | 'none' | 'auto';
    seasonEffectIntensity?: number;
  }) => Promise<{ path: string } | null>;
  onPreviewAll: (config: SystemConfig) => Promise<{ previewPath: string; frontendSiteConfigPath: string; appliedAt: number } | null>;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onUploadFavicon: (file: File) => Promise<string>;
  onUploadCharacterAvatar: (file: File) => Promise<string>;
  onUploadAvatar: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

const SystemSettings: React.FC<SystemSettingsProps> = (props) => {
  return <AdminSettings {...props} />;
};

export default SystemSettings;
