import { Request, Response, NextFunction } from 'express';
import { Jwt } from '../utils/jwt';
import { UserRepository } from '../repositories/UserRepository';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { ADMIN_AUTH_COOKIE, getAuthToken } from '../utils/authCookies';

type JwtPayload = {
  userId?: string | number;
};

const toPayload = (value: unknown): JwtPayload =>
  typeof value === 'object' && value !== null ? (value as JwtPayload) : {};

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = getAuthToken(req, ADMIN_AUTH_COOKIE);
  if (!token) {
    return res.error(401, 'NO_TOKEN', 'Authentication token missing');
  }

  try {
    const payload = toPayload(Jwt.verify(token, { audience: 'admin' }));

    const user = await UserRepository.findById(String(payload.userId));
    if (!user) {
      return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
    }

    if (user.role !== 'admin') {
      return res.error(403, 'FORBIDDEN', 'Admin token required');
    }

    if (!canUserLogin(user)) {
      return res.error(403, 'ACCOUNT_DISABLED', 'Account is disabled');
    }

    req.user = {
      id: String(user._id),
      role: user.role,
      status: getEffectiveUserStatus(user),
    };

    next();
  } catch (err) {
    return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};
