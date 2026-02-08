import { Router } from 'express';
import adminCategoryRoutes from './adminCategoryRoutes';
import adminArticleRoutes from './adminArticleRoutes';
import adminTagRoutes from './adminTagRoutes';
import adminUserRoutes from './adminUserRoutes';
import adminUploadRoutes from './adminUploadRoutes';
import adminConfigRoutes from './adminConfigRoutes';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';

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

export default router;
