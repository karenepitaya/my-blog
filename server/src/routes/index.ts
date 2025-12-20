import { Router } from 'express';
import authRoutes from './authRoutes';
import adminAuthRoutes from './adminAuthRoutes';
import adminRoutes from './adminRoutes';
import articleRoutes from './articleRoutes';
import categoryRoutes from './categoryRoutes';
import tagRoutes from './tagRoutes';
import profileRoutes from './profileRoutes';
import uploadRoutes from './uploadRoutes';
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
router.use('/profile', profileRoutes);
router.use('/uploads', uploadRoutes);
router.use('/articles', articleRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/', publicRoutes);

export default router;
