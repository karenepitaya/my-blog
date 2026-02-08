import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AUTHOR_AUTH_COOKIE, clearAuthCookie, setAuthCookie } from '../utils/authCookies';

const AUTHOR_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.loginAuthor(username, password);
      setAuthCookie(res, AUTHOR_AUTH_COOKIE, result.token, AUTHOR_TOKEN_MAX_AGE_MS);
      return res.success({ user: result.user });
    } catch (err) {
      next(err);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      clearAuthCookie(res, AUTHOR_AUTH_COOKIE);
      return res.success({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
