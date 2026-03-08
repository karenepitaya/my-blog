import { Router } from 'express';
import { z } from 'zod';
import adminCategoryRoutes from './adminCategoryRoutes';
import adminArticleRoutes from './adminArticleRoutes';
import adminTagRoutes from './adminTagRoutes';
import adminUserRoutes from './adminUserRoutes';
import adminUploadRoutes from './adminUploadRoutes';
import adminConfigRoutes from './adminConfigRoutes';
import logRoutes from './logRoutes';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';
import { validateRequest } from '../middlewares/validation';
import { AdminAnalyticsController } from '../controllers/AdminAnalyticsController';
import { AuthorAnalyticsController } from '../controllers/AuthorAnalyticsController';

const router: Router = Router();

router.get('/', (req, res) =>
  res.success({
    message: 'Admin API',
    version: '1.0.0',
      endpoints: {
        auth: '/admin/auth',
        categories: '/admin/categories',
        articles: '/admin/articles',
        tags: '/admin/tags',
        users: '/admin/users',
        config: '/admin/config',
        upload: '/admin/upload',
      },
  })
);

router.get(
  '/rbac-test',
  adminAuthMiddleware,
  requirePermission(Permissions.USER_MANAGE),
  (req, res) => {
    res.success({ message: 'RBAC test passed' });
  }
);

router.use('/categories', adminCategoryRoutes);
router.use('/articles', adminArticleRoutes);
router.use('/tags', adminTagRoutes);
router.use('/users', adminUserRoutes);
router.use('/config', adminConfigRoutes);
router.use('/upload', adminUploadRoutes);
router.use('/logs', logRoutes);

// Admin Analytics Routes
const adminInsightsQuerySchema = z.object({
  range: z.enum(['1h', '24h', '7d']).optional(),
  force: z.coerce.boolean().optional(),
});

router.get(
  '/analytics/insights',
  validateRequest({ query: adminInsightsQuerySchema }),
  AdminAnalyticsController.getInsights
);

// Admin view of specific author's analytics
const authorInsightsQuerySchema = z.object({
  range: z.enum(['7d', '30d', '90d', 'year']).optional(),
  force: z.coerce.boolean().optional(),
});

router.get(
  '/authors/:id/analytics/insights',
  validateRequest({ query: authorInsightsQuerySchema }),
  AuthorAnalyticsController.getAuthorInsights
);

export default router;
