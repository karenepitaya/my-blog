import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router: Router = Router();

// Author auth endpoints
router.post('/login', AuthController.login);

export default router;
