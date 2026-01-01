import React from 'react';
import type { User } from '../types';
import PageHeader from './PageHeader';
import { Settings as AuthorConfigSettings } from './AuthorConfig/pages/Settings';

interface AuthorSettingsProps {
  user: User;
  onUpdateProfile: (input: {
    avatarUrl?: string | null;
    bio?: string | null;
    displayName?: string | null;
    email?: string | null;
    roleTitle?: string | null;
    emojiStatus?: string | null;
  }) => Promise<void>;
  onChangePassword: (input: { currentPassword: string; newPassword: string }) => Promise<void>;
  onUpdateAiConfig: (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
    model?: string | null;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
  onFetchAiModels: (input: {
    vendorId?: string | null;
    apiKey?: string | null;
    baseUrl?: string | null;
  }) => Promise<{ models: string[]; latencyMs: number }>;
}

const AuthorSettings: React.FC<AuthorSettingsProps> = ({
  user,
  onUpdateProfile,
  onChangePassword,
  onUpdateAiConfig,
  onUploadAvatar,
  onFetchAiModels,
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader title="作者配置" />

      <AuthorConfigSettings
        user={user}
        onUpdateProfile={onUpdateProfile}
        onChangePassword={onChangePassword}
        onUpdateAiConfig={onUpdateAiConfig}
        onUploadAvatar={onUploadAvatar}
        onFetchAiModels={onFetchAiModels}
        showHeader={false}
        fullWidth
      />
    </div>
  );
};

export default AuthorSettings;
