import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type Role = 'member' | 'admin';

/**
 * requireRole – RBAC guard middleware factory.
 *
 * Usage:  router.delete('/events/:id', authenticate, requireRole('admin'), handler)
 *         router.post('/events',       authenticate, requireRole('member', 'admin'), handler)
 *
 * A user needs AT LEAST ONE of the listed roles.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `This action requires one of the following roles: ${roles.join(', ')}`,
          'INSUFFICIENT_ROLE',
        ),
      );
    }

    next();
  };
}
