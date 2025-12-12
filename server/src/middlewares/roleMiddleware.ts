import { Request, Response, NextFunction } from 'express';

export const requireRole = (roles: ('admin' | 'author')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.error(401, 'NOT_AUTHENTICATED', 'User not logged in');
    }

    if (!roles.includes(req.user.role)) {
      return res.error(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
};
