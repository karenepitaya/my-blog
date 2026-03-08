import type { Request, Response, NextFunction } from 'express';
import type { AuthorInsightsRange } from '../interfaces/Analytics';
import { AuthorAnalyticsRepository } from '../repositories/AnalyticsRepository';
import { toOptionalEnum } from './utils';

type InsightsQuery = {
  range?: AuthorInsightsRange;
  force?: boolean;
};

type UserIdParams = { id: string };

const getQuery = <T>(req: Request) => (req.validated?.query ?? req.query) as T;
const getParams = <T>(req: Request) => (req.validated?.params ?? req.params) as T;

const normalizeRange = (range?: string): AuthorInsightsRange => {
  if (range === '30d' || range === '90d' || range === 'year') return range;
  return '7d';
};

/**
 * Author Analytics Controller
 * 为作者提供个人文章的数据洞察（阅读量、点赞数等）
 * 适配 2C2G 环境：缓存 60 秒，MongoDB Aggregation 实时计算
 */
export const AuthorAnalyticsController = {
  /**
   * 获取当前作者的洞察数据
   * GET /profile/analytics/insights?range=7d|30d|90d|year&force=1
   * 
   * 从 req.user 获取当前登录作者 ID（由 authMiddleware 注入）
   */
  async getMyInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const query = getQuery<InsightsQuery>(req);
      const range = normalizeRange(
        toOptionalEnum(query.range, ['7d', '30d', '90d', 'year'] as const)
      );
      const force = query.force === true;

      // 从认证信息获取当前用户 ID
      const userId = req.user?.id;
      if (!userId) {
        return res.error(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      const result = await AuthorAnalyticsRepository.getInsights(userId, range, force);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * 获取指定作者的数据（管理员权限）
   * GET /admin/authors/:id/analytics/insights?range=7d|30d|90d|year&force=1
   * 
   * 用于管理员查看特定作者的数据
   */
  async getAuthorInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = getParams<UserIdParams>(req);
      const query = getQuery<InsightsQuery>(req);
      const range = normalizeRange(
        toOptionalEnum(query.range, ['7d', '30d', '90d', 'year'] as const)
      );
      const force = query.force === true;

      const result = await AuthorAnalyticsRepository.getInsights(id, range, force);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
