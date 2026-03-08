import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { LogController } from '../controllers/LogController';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';

const router: ExpressRouter = Router();

// 查询参数验证
const logQuerySchema = z.object({
  scope: z.enum(['FRONTEND', 'BACKEND', 'SERVER']).optional(),
  level: z.enum(['INFO', 'WARN', 'ERROR', 'SUCCESS']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(500).optional(),
  source: z.string().trim().optional(),
});

// 所有日志接口需要管理员权限
router.use(adminAuthMiddleware);
router.use(requirePermission(Permissions.SYSTEM_CONFIG));

/**
 * 获取内存热日志（最近 500 条，<10ms）
 * GET /admin/logs/hot
 */
router.get(
  '/hot',
  validateRequest({ query: logQuerySchema }),
  LogController.getHotLogs
);

/**
 * 获取文件归档日志（流式读取）
 * GET /admin/logs/archive
 */
router.get(
  '/archive',
  validateRequest({ query: logQuerySchema }),
  LogController.getArchiveLogs
);

/**
 * 实时日志流（SSE）
 * GET /admin/logs/stream
 */
router.get(
  '/stream',
  validateRequest({ query: logQuerySchema }),
  LogController.streamLogs
);

/**
 * 日志统计
 * GET /admin/logs/stats
 */
router.get('/stats', LogController.getStats);

/**
 * 清空内存缓存
 * POST /admin/logs/clear
 */
router.post('/clear', LogController.clearLogs);

export default router;
