// server/src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { Jwt } from '../utils/jwt';
import { UserRepository } from '../repositories/UserRepository';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.error(401, 'NO_TOKEN', 'Authorization token missing');
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = Jwt.verify(token, { audience: 'author' }) as any;

    const user = await UserRepository.findById(String(payload.userId));
    if (!user) {
      return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }

    if (user.role !== 'author') {
      return res.error(403, 'FORBIDDEN', 'Author token required');
    }

    if (!canUserLogin(user)) {
      return res.error(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      status: getEffectiveUserStatus(user),
      impersonatorAdminId:
        payload && typeof payload.impersonatorAdminId === 'string'
          ? payload.impersonatorAdminId
          : undefined,
    };

    next();
  } catch (err) {
    return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};
