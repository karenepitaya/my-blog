import React from 'react';
import type { SystemConfig } from '../types';
import AdminSettings from './NeoSettings/AdminSettings';

interface SystemSettingsProps {
  token: string;
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onUploadFavicon: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

const SystemSettings: React.FC<SystemSettingsProps> = (props) => {
  return <AdminSettings {...props} />;
};

export default SystemSettings;
