import { Router } from 'express';
import adminCategoryRoutes from './adminCategoryRoutes';
import adminUserRoutes from './adminUserRoutes';
import { adminAuthMiddleware } from '../middlewares/adminAuthMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';

const router: Router = Router();

// Admin info endpoint
router.get('/', (req, res) =>
  res.success({
    message: 'Admin API',
    version: '1.0.0',
    endpoints: {
      auth: '/admin/auth',
      categories: '/admin/categories',
      users: '/admin/users',
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

// Category routes
router.use('/categories', adminCategoryRoutes);
router.use('/users', adminUserRoutes);

export default router;
