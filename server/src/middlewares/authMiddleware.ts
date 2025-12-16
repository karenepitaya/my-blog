// server/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { Jwt } from '../utils/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.error(401, 'NO_TOKEN', 'Authorization token missing');
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = Jwt.verify(token) as any;
    req.user = {
      id: payload.userId,
      role: payload.role
    };
    next();
  } catch (err) {
    return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};
