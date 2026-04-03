import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

type Role = 'VIEWER' | 'ANALYST' | 'ADMIN';

const PERMISSIONS: Record<Role, string[]> = {
  VIEWER: ['records:read', 'dashboard:read'],
  ANALYST: ['records:read', 'dashboard:read', 'dashboard:insights'],
  ADMIN: [
    'records:read',
    'records:write',
    'records:delete',
    'dashboard:read',
    'dashboard:insights',
    'users:read',
    'users:write',
  ],
};

export const rbac = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = req.user.role as Role;
    const rolePermissions = PERMISSIONS[userRole] || [];
    const hasPermission = rolePermissions.includes(permission);

    if (!hasPermission) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }

    next();
  };
};
