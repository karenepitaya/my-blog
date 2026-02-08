import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middlewares/validation';

const router: Router = Router();

const loginBodySchema = z
  .object({
    username: z.string().trim().min(3).max(30),
    password: z.string().min(6).max(100),
  })
  .strict();

router.post('/login', validateRequest({ body: loginBodySchema }), AuthController.login);
router.post('/logout', AuthController.logout);

export default router;
