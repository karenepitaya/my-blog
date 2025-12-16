import { Router } from 'express';
import categoryRoutes from './categoryRoutes';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/requirePermission';
import { Permissions } from '../permissions/permissions';

const router: Router = Router();

// Admin info endpoint
router.get('/', (req, res) =>
  res.success({
    message: 'Admin API',
    version: '1.0.0',
    endpoints: {
      categories: '/admin/categories',
    },
  })
);

router.get(
  '/rbac-test',
  authMiddleware,
  requirePermission(Permissions.USER_MANAGE),
  (req, res) => {
    res.success({ message: 'RBAC test passed' });
  }
);

// Category routes
router.use('/categories', categoryRoutes);

export default router;
