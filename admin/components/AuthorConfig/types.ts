import { ReactNode } from 'react';

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
