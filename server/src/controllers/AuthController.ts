import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      return res.success(result);
    } catch (err) {
      next(err);
    }
  },
};
