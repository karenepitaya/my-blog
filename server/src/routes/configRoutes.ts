import { Router, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { SystemConfigController } from '../controllers/SystemConfigController';

const router: ExpressRouter = Router();

router.use(authMiddleware);
router.get('/', SystemConfigController.get);

export default router;
