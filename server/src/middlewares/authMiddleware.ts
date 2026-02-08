import { Request, Response, NextFunction } from 'express';
import { Jwt } from '../utils/jwt';
import { UserRepository } from '../repositories/UserRepository';
import { canUserLogin, getEffectiveUserStatus } from '../utils/userStatus';
import { AUTHOR_AUTH_COOKIE, getAuthToken } from '../utils/authCookies';

type JwtPayload = {
  userId?: string | number;
  impersonatorAdminId?: string;
};

const toPayload = (value: unknown): JwtPayload =>
  typeof value === 'object' && value !== null ? (value as JwtPayload) : {};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = getAuthToken(req, AUTHOR_AUTH_COOKIE);
  if (!token) {
    return res.error(401, 'NO_TOKEN', 'Authentication token missing');
  }

  // CONTRACT: Invalid/expired author tokens return 401 INVALID_TOKEN.
  try {
    const payload = toPayload(Jwt.verify(token, { audience: 'author' }));

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

    const impersonatorAdminId =
      typeof payload.impersonatorAdminId === 'string' ? payload.impersonatorAdminId : undefined;
    req.user = {
      id: String(user._id),
      role: user.role,
      status: getEffectiveUserStatus(user),
      ...(impersonatorAdminId ? { impersonatorAdminId } : {}),
    };

    next();
  } catch (err) {
    return res.error(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
};
