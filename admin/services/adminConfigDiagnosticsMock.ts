export type DiagnosticStatus = 'ok' | 'warn' | 'error' | 'unknown';

export type ConfigDiagnosticCheck = {
  key: string;
  label: string;
  status: DiagnosticStatus;
  message?: string;
};

export type ConfigDiagnostics = {
  generatedAt: string;
  checks: ConfigDiagnosticCheck[];
};

export const getMockConfigDiagnostics = (): ConfigDiagnostics => ({
  generatedAt: new Date().toISOString(),
  checks: [
    {
      key: 'config_store',
      label: '配置存储',
      status: 'unknown',
      message: 'Mock：后续接入真实检测逻辑。',
    },
    {
      key: 'object_storage',
      label: '对象存储',
      status: 'unknown',
      message: 'Mock：后续接入 OSS/MinIO 连接测试。',
    },
    {
      key: 'analytics',
      label: '数据分析',
      status: 'unknown',
      message: 'Mock：后续接入外部统计工具检测。',
    },
  ],
});

