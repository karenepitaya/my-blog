import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router: Router = Router();

// Temporary placeholder
router.post('/login', AuthController.login);

export default router;
