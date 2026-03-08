import type { Request, Response, NextFunction } from 'express';
import type { AdminInsightsRange } from '../interfaces/Analytics';
import { AdminAnalyticsRepository } from '../repositories/AnalyticsRepository';
import { toOptionalEnum } from './utils';

type InsightsQuery = {
  range?: AdminInsightsRange;
  force?: boolean;
};

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;

const normalizeRange = (range?: string): AdminInsightsRange => {
  if (range === '24h' || range === '7d') return range;
  return '1h';
};

/**
 * Admin Analytics Controller
 * 提供系统级统计数据（资源使用、数据库 CRUD 等）
 * 适配 2C2G 环境：缓存 60 秒，避免频繁聚合查询
 */
export const AdminAnalyticsController = {
  /**
   * 获取管理员洞察数据
   * GET /admin/analytics/insights?range=1h|24h|7d&force=1
   */
  async getInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<InsightsQuery>(req);
      const range = normalizeRange(toOptionalEnum(query.range, ['1h', '24h', '7d'] as const));
      const force = query.force === true;

      const result = await AdminAnalyticsRepository.getInsights(range, force);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
