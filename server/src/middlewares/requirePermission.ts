import { Request, Response, NextFunction } from 'express';
import { Permission } from '../permissions/permissions';
import { Role } from '../permissions/roles';
import { can } from '../permissions/can';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id: string; role: Role } | undefined;

    if (!user) {
      return res.error(401, 'NOT_AUTHENTICATED', 'User not authenticated');
    }

    const allowed = can({
      role: user.role,
      permission,
      userId: user.id,
    });

    if (!allowed) {
      return res.error(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
}
