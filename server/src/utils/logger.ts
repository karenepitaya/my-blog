import { createLogger, format, transports, type Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import mongoose from 'mongoose';
import type { ObjectId } from 'mongoose';

/**
 * Log Entry Interface
 * 与 Admin 端的 LogEntry 类型兼容
 */
export interface LogEntry {
  id: number;
  timestamp: string;
  scope: 'FRONTEND' | 'BACKEND' | 'SERVER';
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  source: string;
  message: string;
  traceId?: string | undefined;
  meta?: Record<string, unknown> | undefined;
}

// 全局日志 ID 计数器（用于内存缓存）
let logIdCounter = 1;

// 内存缓存（最近 500 条热日志，用于 Admin 快速查看）
const memoryLogs: LogEntry[] = [];
const MAX_MEMORY_LOGS = 500;

/**
 * 获取日志集合（Capped Collection）
 * 延迟初始化，避免启动时连接问题
 */
const getLogCollection = () => {
  if (mongoose.connection.readyState !== 1) {
    return null;
  }
  return mongoose.connection.db?.collection('system_logs');
};

/**
 * Winston 日志格式
 * 紧凑 JSON，减少磁盘占用（2C2G 环境）
 */
const compactJsonFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

/**
 * 控制台格式（开发环境）
 * 生产环境可禁用以减少 IO
 */
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp({ format: 'HH:mm:ss' }),
  format.printf((info) => {
    const { level, message, timestamp, scope, source } = info as {
      level: string;
      message: string;
      timestamp: string;
      scope: string;
      source: string;
    };
    const scopeTag = scope ? `[${scope}]` : '';
    const sourceTag = source ? `(${source})` : '';
    return `${timestamp} ${level} ${scopeTag}${sourceTag} ${message}`;
  })
);

// 判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

/**
 * 创建 Winston Logger
 * 配置：
 * - 文件轮转：每天一个文件，保留 14 天，自动压缩
 * - MongoDB：Capped Collection（50MB），仅 WARN+
 * - 控制台：非生产环境输出
 */
const winstonLogger: Logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    scope: 'SERVER',
    source: 'system',
  },
  transports: [
    // 文件轮转：所有级别日志
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m', // 单个文件 50MB
      maxFiles: '14d', // 保留 14 天
      zippedArchive: true, // 压缩旧日志
      format: compactJsonFormat,
    }),

    // 错误文件：单独存储 ERROR 级别
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d', // 错误保留更久
      zippedArchive: true,
      level: 'error',
      format: compactJsonFormat,
    }),

    // 控制台：开发环境
    ...(isProduction
      ? []
      : [
          new transports.Console({
            format: consoleFormat,
          }),
        ]),
  ],

  // 异常处理：避免未捕获异常导致进程退出
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

/**
 * 写入 MongoDB Capped Collection
 * 仅 WARN 及以上级别，减少写入压力
 */
const writeToMongo = async (entry: LogEntry): Promise<void> => {
  if (entry.level !== 'WARN' && entry.level !== 'ERROR') {
    return;
  }

  const collection = getLogCollection();
  if (!collection) {
    // MongoDB 未连接，静默丢弃（避免阻塞）
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: Record<string, any> = {
      ...entry,
      _id: entry.id as unknown as ObjectId,
      ts: new Date(entry.timestamp),
    };
    await collection.insertOne(doc);
  } catch {
    // 写入失败不抛错，避免影响业务
  }
};

/**
 * 添加到内存缓存
 */
const addToMemoryCache = (entry: LogEntry): void => {
  memoryLogs.unshift(entry);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.pop();
  }
};

/**
 * 构建 LogEntry
 */
const buildLogEntry = (
  level: LogEntry['level'],
  message: string,
  options: {
    scope?: LogEntry['scope'];
    source?: string;
    traceId?: string;
    meta?: Record<string, unknown>;
  } = {}
): LogEntry => ({
  id: logIdCounter++,
  timestamp: new Date().toISOString(),
  scope: options.scope || 'SERVER',
  level,
  source: options.source || 'system',
  message,
  traceId: options.traceId || `trace-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  meta: options.meta,
});

/**
 * 主 Logger 对象
 * 兼容原有接口：logger.info(), logger.error()
 * 新增功能：支持 scope, source, traceId, meta
 */
export const logger = {
  /**
   * INFO 级别日志
   */
  info: (message: string, options?: { scope?: string; source?: string; traceId?: string; meta?: Record<string, unknown> }) => {
    const entry = buildLogEntry('INFO', message, {
      ...options,
      scope: (options?.scope as LogEntry['scope']) || 'SERVER',
    });

    // Winston 文件日志
    winstonLogger.info(message, {
      scope: entry.scope,
      source: entry.source,
      traceId: entry.traceId,
      meta: entry.meta,
    });

    // 内存缓存
    addToMemoryCache(entry);

    // 异步写入 MongoDB（不 await，避免阻塞）
    void writeToMongo(entry);
  },

  /**
   * WARN 级别日志
   */
  warn: (message: string, options?: { scope?: string; source?: string; traceId?: string; meta?: Record<string, unknown> }) => {
    const entry = buildLogEntry('WARN', message, {
      ...options,
      scope: (options?.scope as LogEntry['scope']) || 'SERVER',
    });

    winstonLogger.warn(message, {
      scope: entry.scope,
      source: entry.source,
      traceId: entry.traceId,
      meta: entry.meta,
    });

    addToMemoryCache(entry);
    void writeToMongo(entry);
  },

  /**
   * ERROR 级别日志
   */
  error: (message: string, error?: Error, options?: { scope?: string; source?: string; traceId?: string; meta?: Record<string, unknown> }) => {
    const entry = buildLogEntry('ERROR', message, {
      ...options,
      scope: (options?.scope as LogEntry['scope']) || 'SERVER',
    });

    winstonLogger.error(message, {
      scope: entry.scope,
      source: entry.source,
      traceId: entry.traceId,
      meta: {
        ...entry.meta,
        error: error?.message,
        stack: error?.stack,
      },
    });

    addToMemoryCache(entry);
    void writeToMongo(entry);
  },

  /**
   * SUCCESS 级别日志（自定义）
   */
  success: (message: string, options?: { scope?: string; source?: string; traceId?: string; meta?: Record<string, unknown> }) => {
    const entry = buildLogEntry('SUCCESS', message, {
      ...options,
      scope: (options?.scope as LogEntry['scope']) || 'SERVER',
    });

    winstonLogger.info(`[SUCCESS] ${message}`, {
      scope: entry.scope,
      source: entry.source,
      traceId: entry.traceId,
      meta: entry.meta,
    });

    addToMemoryCache(entry);
    void writeToMongo(entry);
  },

  /**
   * 获取内存缓存日志（热数据）
   * 用于 Admin 实时查看
   */
  getMemoryLogs: (filter?: {
    scope?: LogEntry['scope'] | undefined;
    level?: LogEntry['level'] | undefined;
    limit?: number | undefined;
  }): LogEntry[] => {
    let logs = [...memoryLogs];

    if (filter?.scope) {
      logs = logs.filter((l) => l.scope === filter.scope);
    }
    if (filter?.level) {
      logs = logs.filter((l) => l.level === filter.level);
    }

    return logs.slice(0, filter?.limit || 100);
  },

  /**
   * 清空内存缓存
   */
  clearMemoryLogs: (): void => {
    memoryLogs.length = 0;
  },

  /**
   * 获取 Winston Logger 实例（用于需要直接操作的场景）
   */
  getWinstonInstance: (): Logger => winstonLogger,
};

/**
 * 初始化 Capped Collection（用于 MongoDB 存储）
 * 在应用启动后调用一次
 */
export async function initLogCollection(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    console.log('[Logger] MongoDB not connected, skip capped collection init');
    return;
  }

  const db = mongoose.connection.db;
  if (!db) {
    return;
  }

  const collectionName = 'system_logs';

  try {
    const collections = await db.listCollections({ name: collectionName }).toArray();
    const exists = collections.length > 0;

    if (!exists) {
      await db.createCollection(collectionName, {
        capped: true,
        size: 50 * 1024 * 1024, // 50MB
        max: 100000, // 最多 10 万条
      });
      console.log('[Logger] Created capped collection: system_logs (50MB)');
    } else {
      console.log('[Logger] Capped collection ready: system_logs');
    }
  } catch (err) {
    console.error('[Logger] Failed to init capped collection:', err);
  }
}

export default logger;
