import { ReactNode } from 'react';

export interface AIVendor {
  id: string;
  name: string;
  icon: ReactNode;
  color: string; // Hex for glow effects
  defaultBaseUrl: string;
}

export type SettingsTab = 'ACCOUNT' | 'AI_MODELS' | 'SECURITY';
