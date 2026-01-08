import React from 'react';
import type { SystemConfig } from '../types';
import AdminConfig from './AdminConfig';

interface SystemSettingsProps {
  config: SystemConfig;
  onUpdate: (config: SystemConfig) => Promise<SystemConfig | null>;
  onUploadFavicon: (file: File) => Promise<string>;
  onTestOssUpload: () => Promise<string>;
}

const SystemSettings: React.FC<SystemSettingsProps> = (props) => {
  return <AdminConfig {...props} />;
};

export default SystemSettings;
