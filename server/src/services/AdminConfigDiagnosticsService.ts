import mongoose from 'mongoose';
import QuickLRU from 'quick-lru';
import { SystemConfigRepository } from '../repositories/SystemConfigRepository';

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

// 缓存配置：30秒过期，最多10个key（内存占用 < 100KB）
const CACHE_MAX_AGE = 30 * 1000;
const diagnosticsCache = new QuickLRU<string, ConfigDiagnostics>({
  maxSize: 10,
  maxAge: CACHE_MAX_AGE,
});

// 检测超时配置（毫秒）
const CHECK_TIMEOUT = 5000;

/**
 * 带超时的 Promise 包装器
 * 极致性能：避免长时间等待阻塞事件循环
 */
const withTimeout = <T>(
  promise: Promise<T>,
  ms: number,
  timeoutValue: T
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(timeoutValue), ms)),
  ]);
};

/**
 * MongoDB 健康检测
 * 直接使用 mongoose 内部连接，不创建新连接
 */
const checkMongoDB = async (): Promise<ConfigDiagnosticCheck> => {
  try {
    // 复用现有 mongoose 连接，零额外开销
    if (mongoose.connection.readyState !== 1) {
      return {
        key: 'mongodb',
        label: 'MongoDB 连接',
        status: 'error',
        message: `连接未就绪 (状态: ${mongoose.connection.readyState})`,
      };
    }

    // 轻量级 ping 检测，< 10ms
    const startTime = performance.now();
    const db = mongoose.connection.db;
    if (!db) {
      return {
        key: 'mongodb',
        label: 'MongoDB 连接',
        status: 'error',
        message: '数据库实例未初始化',
      };
    }
    await db.admin().ping();
    const latency = Math.round(performance.now() - startTime);

    return {
      key: 'mongodb',
      label: 'MongoDB 连接',
      status: 'ok',
      message: `响应正常 (${latency}ms)`,
    };
  } catch (err) {
    return {
      key: 'mongodb',
      label: 'MongoDB 连接',
      status: 'error',
      message: `检测失败: ${err instanceof Error ? err.message : '未知错误'}`,
    };
  }
};

/**
 * 配置存储检测
 * 验证能否正常读写 SystemConfig
 */
const checkConfigStore = async (): Promise<ConfigDiagnosticCheck> => {
  try {
    const startTime = performance.now();
    const config = await withTimeout(
      SystemConfigRepository.get(),
      CHECK_TIMEOUT,
      null
    );
    const latency = Math.round(performance.now() - startTime);

    if (config === null) {
      // 配置不存在是正常状态（首次使用）
      return {
        key: 'config_store',
        label: '配置存储',
        status: 'ok',
        message: '存储正常 (未配置)',
      };
    }

    return {
      key: 'config_store',
      label: '配置存储',
      status: 'ok',
      message: `读写正常 (${latency}ms)`,
    };
  } catch (err) {
    return {
      key: 'config_store',
      label: '配置存储',
      status: 'error',
      message: `检测失败: ${err instanceof Error ? err.message : '未知错误'}`,
    };
  }
};

/**
 * 对象存储健康检测
 * 使用 HTTP HEAD 请求探活，零 SDK 依赖
 */
const checkObjectStorage = async (): Promise<ConfigDiagnosticCheck> => {
  try {
    const config = await SystemConfigRepository.get();
    const ossConfig = config?.oss;

    if (!ossConfig || !ossConfig.provider) {
      return {
        key: 'object_storage',
        label: '对象存储',
        status: 'unknown',
        message: '未配置对象存储',
      };
    }

    const { provider, endpoint, bucket } = ossConfig;

    if (!endpoint || !bucket) {
      return {
        key: 'object_storage',
        label: '对象存储',
        status: 'warn',
        message: `${provider}: 配置不完整 (缺少 endpoint 或 bucket)`,
      };
    }

    // 构建探活 URL
    // OSS: https://bucket.endpoint/
    // MinIO: https://endpoint/bucket/
    const probeUrl = provider === 'oss'
      ? `${endpoint.replace(/\/+$/, '')}/${bucket}/`
      : `${endpoint.replace(/\/+$/, '')}/${bucket}/`;

    const startTime = performance.now();

    // 轻量级 HEAD 请求，不下载内容
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

    try {
      const response = await fetch(probeUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      // 2xx 或 403（无权限访问 bucket，但服务正常）都表示服务可用
      if (response.ok || response.status === 403) {
        return {
          key: 'object_storage',
          label: '对象存储',
          status: 'ok',
          message: `${provider}: 服务正常 (${latency}ms)`,
        };
      }

      return {
        key: 'object_storage',
        label: '对象存储',
        status: 'warn',
        message: `${provider}: 服务异常 (HTTP ${response.status}, ${latency}ms)`,
      };
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        key: 'object_storage',
        label: '对象存储',
        status: 'error',
        message: '检测超时 (5s)',
      };
    }

    return {
      key: 'object_storage',
      label: '对象存储',
      status: 'error',
      message: `检测失败: ${err instanceof Error ? err.message : '未知错误'}`,
    };
  }
};

/**
 * 分析工具健康检测
 * 检查配置的 Analytics 端点是否可访问
 */
const checkAnalytics = async (): Promise<ConfigDiagnosticCheck> => {
  try {
    const config = await SystemConfigRepository.get();
    const statsEndpoint = config?.admin?.statsApiEndpoint;

    if (!statsEndpoint) {
      return {
        key: 'analytics',
        label: '数据分析',
        status: 'unknown',
        message: '未配置分析工具',
      };
    }

    const startTime = performance.now();

    // 轻量级 GET 请求到分析端点
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

    try {
      const response = await fetch(statsEndpoint, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (response.ok) {
        return {
          key: 'analytics',
          label: '数据分析',
          status: 'ok',
          message: `服务正常 (${latency}ms)`,
        };
      }

      return {
        key: 'analytics',
        label: '数据分析',
        status: 'warn',
        message: `服务异常 (HTTP ${response.status}, ${latency}ms)`,
      };
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        key: 'analytics',
        label: '数据分析',
        status: 'error',
        message: '检测超时 (5s)',
      };
    }

    return {
      key: 'analytics',
      label: '数据分析',
      status: 'error',
      message: `检测失败: ${err instanceof Error ? err.message : '未知错误'}`,
    };
  }
};

export const AdminConfigDiagnosticsService = {
  /**
   * 获取配置诊断信息
   * 带 30 秒缓存，避免频繁检测
   */
  async getDiagnostics(): Promise<ConfigDiagnostics> {
    const cacheKey = 'default';
    const cached = diagnosticsCache.get(cacheKey);

    if (cached) {
      return cached;
    }

    // 并行执行所有检测（最大化利用 2 核 CPU）
    const [mongoCheck, configCheck, storageCheck, analyticsCheck] = await Promise.all([
      checkMongoDB(),
      checkConfigStore(),
      checkObjectStorage(),
      checkAnalytics(),
    ]);

    const result: ConfigDiagnostics = {
      generatedAt: new Date().toISOString(),
      checks: [mongoCheck, configCheck, storageCheck, analyticsCheck],
    };

    diagnosticsCache.set(cacheKey, result);
    return result;
  },

  /**
   * 强制刷新诊断（绕过缓存）
   * 用于管理后台的手动刷新按钮
   */
  async getDiagnosticsFresh(): Promise<ConfigDiagnostics> {
    diagnosticsCache.delete('default');
    return this.getDiagnostics();
  },

  /**
   * 清除缓存
   * 用于测试或配置变更后
   */
  clearCache(): void {
    diagnosticsCache.clear();
  },
};
