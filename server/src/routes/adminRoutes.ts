import { Router } from 'express';
import categoryRoutes from './categoryRoutes';

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

// Category routes
router.use('/categories', categoryRoutes);

export default router;
