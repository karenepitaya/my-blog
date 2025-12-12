import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import publicRoutes from './publicRoutes';

const router: Router = Router();

// Health check
router.get('/health', (req, res) => {
  return res.success({ status: 'ok' });
});

// Subroutes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/', publicRoutes);

export default router;
