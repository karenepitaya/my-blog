import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middlewares/validation';
import { AdminAnalyticsController } from '../controllers/AdminAnalyticsController';
import { AuthorAnalyticsController } from '../controllers/AuthorAnalyticsController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';

const router: ExpressRouter = Router();

// 查询参数验证 Schema
const adminInsightsQuerySchema = z.object({
  range: z.enum(['1h', '24h', '7d']).optional(),
  force: z.coerce.boolean().optional(),
});

const authorInsightsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'year']).optional(),
  force: z.coerce.boolean().optional(),
});

/**
 * Admin Analytics Routes
 * 系统级统计数据（需要管理员权限）
 * 
 * 路径前缀: /admin/analytics
 */
const adminAnalyticsRouter: ExpressRouter = Router();
adminAnalyticsRouter.use(adminAuthMiddleware);
adminAnalyticsRouter.use(requirePermission(Permissions.SYSTEM_CONFIG));

adminAnalyticsRouter.get(
  '/insights',
  validateRequest({ query: adminInsightsQuerySchema }),
  AdminAnalyticsController.getInsights
);

/**
 * Author Analytics Routes (Profile)
 * 作者个人数据（需要登录）
 * 
 * 路径前缀: /profile/analytics
 */
const authorAnalyticsRouter: ExpressRouter = Router();
authorAnalyticsRouter.use(authMiddleware);

authorAnalyticsRouter.get(
  '/insights',
  validateRequest({ query: authorInsightsQuerySchema }),
  AuthorAnalyticsController.getMyInsights
);

// 导出路由（由主路由挂载）
export { adminAnalyticsRouter, authorAnalyticsRouter };

// 默认导出兼容旧方式
export default router;
