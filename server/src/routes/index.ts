import { Router } from 'express';
import authRoutes from './authRoutes';
import adminAuthRoutes from './adminAuthRoutes';
import adminRoutes from './adminRoutes';
import categoryRoutes from './categoryRoutes';
import publicRoutes from './publicRoutes';

const router: Router = Router();

// Health check
router.get('/health', (req, res) => {
  return res.success({ status: 'ok' });
});

// Subroutes
router.use('/auth', authRoutes);
router.use('/admin/auth', adminAuthRoutes);
router.use('/admin', adminRoutes);
router.use('/categories', categoryRoutes);
router.use('/', publicRoutes);

export default router;
