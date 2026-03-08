import type { Request, Response, NextFunction } from 'express';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import path from 'path';
import { logger, type LogEntry } from '../utils/logger';
import { toOptionalEnum, normalizePagination } from './utils';

type LogQuery = {
  scope?: 'FRONTEND' | 'BACKEND' | 'SERVER';
  level?: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  page?: number;
  pageSize?: number;
  source?: string;
};

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;

/**
 * 解析日志文件行
 * 支持 Winston JSON 格式和旧格式
 */
const parseLogLine = (line: string): LogEntry | null => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    // 尝试解析 JSON 格式
    const parsed = JSON.parse(trimmed);
    return {
      id: parsed.id || Date.now(),
      timestamp: parsed.timestamp || new Date().toISOString(),
      scope: parsed.scope || 'SERVER',
      level: parsed.level?.toUpperCase() || 'INFO',
      source: parsed.source || 'system',
      message: parsed.message || trimmed,
      traceId: parsed.traceId,
      meta: parsed.meta,
    };
  } catch {
    // 解析失败，返回原始行作为消息
    return {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      scope: 'SERVER',
      level: 'INFO',
      source: 'unknown',
      message: trimmed,
    };
  }
};

/**
 * 创建日志过滤转换流
 */
const createLogFilter = (filter: { scope?: string | undefined; level?: string | undefined; source?: string | undefined }) => {
  let buffer = '';

  return new Transform({
    objectMode: true,
    transform(chunk: Buffer, encoding, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留未完整的一行

      for (const line of lines) {
        const entry = parseLogLine(line);
        if (!entry) continue;

        // 过滤
        if (filter.scope && entry.scope !== filter.scope) continue;
        if (filter.level && entry.level !== filter.level) continue;
        if (filter.source && !entry.source.includes(filter.source)) continue;

        this.push(entry);
      }

      callback();
    },
    flush(callback) {
      // 处理缓冲区剩余内容
      if (buffer.trim()) {
        const entry = parseLogLine(buffer);
        if (entry) {
          if (!filter.scope || entry.scope === filter.scope) {
            if (!filter.level || entry.level === filter.level) {
              if (!filter.source || entry.source.includes(filter.source)) {
                this.push(entry);
              }
            }
          }
        }
      }
      callback();
    },
  });
};

/**
 * Log Controller
 * 提供日志查询接口（内存热数据 + 文件冷数据）
 * 适配 2C2G 环境：流式读取，避免内存爆炸
 */
export const LogController = {
  /**
   * 获取内存缓存日志（热数据，最近 500 条）
   * GET /admin/logs/hot?scope=&level=&limit=
   * 响应时间: < 10ms
   */
  async getHotLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<LogQuery>(req);
      const scope = toOptionalEnum(query.scope, ['FRONTEND', 'BACKEND', 'SERVER'] as const);
      const level = toOptionalEnum(query.level, ['INFO', 'WARN', 'ERROR', 'SUCCESS'] as const);
      const { page, pageSize } = normalizePagination(query, { page: 1, pageSize: 50 });

      const logs = logger.getMemoryLogs({
        scope: scope as 'FRONTEND' | 'BACKEND' | 'SERVER' | undefined,
        level: level as 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | undefined,
        limit: pageSize * page,
      });

      // 分页
      const start = (page - 1) * pageSize;
      const paginatedLogs = logs.slice(start, start + pageSize);

      return res.success({
        items: paginatedLogs,
        total: logs.length,
        page,
        pageSize,
        source: 'memory',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 获取文件日志（冷数据，流式读取）
   * GET /admin/logs/archive?scope=&level=&page=&pageSize=
   * 注意：流式读取，不支持精确分页，返回最近 N 条匹配的日志
   */
  async getArchiveLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<LogQuery>(req);
      const scope = toOptionalEnum(query.scope, ['FRONTEND', 'BACKEND', 'SERVER'] as const);
      const level = toOptionalEnum(query.level, ['INFO', 'WARN', 'ERROR', 'SUCCESS'] as const);
      const source = query.source?.trim();
      const { pageSize } = normalizePagination(query, { page: 1, pageSize: 100 });

      // 读取今天的日志文件
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(process.cwd(), 'logs', `app-${today}.log`);

      // 如果文件不存在，返回空
      const fs = await import('fs');
      if (!fs.existsSync(logFile)) {
        return res.success({
          items: [],
          total: 0,
          page: 1,
          pageSize,
          source: 'archive',
        });
      }

      // 流式读取并收集匹配日志
      const matches: LogEntry[] = [];
      const filter = createLogFilter({
        scope,
        level,
        source,
      });

      filter.on('data', (entry: LogEntry) => {
        matches.push(entry);
        // 只保留最后 pageSize 条，控制内存
        if (matches.length > pageSize) {
          matches.shift();
        }
      });

      await pipeline(createReadStream(logFile), filter);

      return res.success({
        items: matches.reverse(), // 最新的在前
        total: matches.length,
        page: 1,
        pageSize,
        source: 'archive',
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 获取日志流（SSE 实时推送）
   * GET /admin/logs/stream?scope=&level=
   * 用于 Admin 实时查看日志
   */
  async streamLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<LogQuery>(req);
      const scope = toOptionalEnum(query.scope, ['FRONTEND', 'BACKEND', 'SERVER'] as const);
      const level = toOptionalEnum(query.level, ['INFO', 'WARN', 'ERROR', 'SUCCESS'] as const);

      // 设置 SSE 头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 发送初始数据（内存缓存的最新 50 条）
      const initialLogs = logger.getMemoryLogs({
        scope: scope as 'FRONTEND' | 'BACKEND' | 'SERVER' | undefined,
        level: level as 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | undefined,
        limit: 50,
      });
      res.write(`data: ${JSON.stringify({ type: 'init', logs: initialLogs })}\n\n`);

      // 简单的轮询机制（每 2 秒推送新日志）
      let lastId = initialLogs[0]?.id || 0;

      const interval = setInterval(() => {
        const logs = logger.getMemoryLogs({
          scope: scope as 'FRONTEND' | 'BACKEND' | 'SERVER' | undefined,
          level: level as 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | undefined,
          limit: 100,
        });
        const newLogs = logs.filter((l) => l.id > lastId);

        if (newLogs.length > 0) {
          lastId = newLogs[0].id;
          res.write(`data: ${JSON.stringify({ type: 'update', logs: newLogs })}\n\n`);
        }
      }, 2000);

      // 客户端断开时清理
      req.on('close', () => {
        clearInterval(interval);
        res.end();
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 清空内存缓存日志
   * POST /admin/logs/clear
   */
  async clearLogs(req: Request, res: Response, next: NextFunction) {
    try {
      logger.clearMemoryLogs();
      return res.success({ message: 'Memory logs cleared' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * 获取日志统计
   * GET /admin/logs/stats
   */
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = logger.getMemoryLogs({ limit: 500 });

      const stats = {
        total: logs.length,
        byScope: {
          FRONTEND: logs.filter((l) => l.scope === 'FRONTEND').length,
          BACKEND: logs.filter((l) => l.scope === 'BACKEND').length,
          SERVER: logs.filter((l) => l.scope === 'SERVER').length,
        },
        byLevel: {
          INFO: logs.filter((l) => l.level === 'INFO').length,
          WARN: logs.filter((l) => l.level === 'WARN').length,
          ERROR: logs.filter((l) => l.level === 'ERROR').length,
          SUCCESS: logs.filter((l) => l.level === 'SUCCESS').length,
        },
        recentErrors: logs
          .filter((l) => l.level === 'ERROR')
          .slice(0, 5)
          .map((l) => ({
            id: l.id,
            timestamp: l.timestamp,
            message: l.message,
            source: l.source,
          })),
      };

      return res.success(stats);
    } catch (err) {
      next(err);
    }
  },
};
