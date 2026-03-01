import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        firebaseUid: string;
        email: string;
        displayName: string;
        role: 'member' | 'admin';
        isActive: boolean;
      };
    }
  }
}

const userRepo = new UserRepository();

/**
 * authenticate – extracts and verifies a Firebase ID token from the
 * `Authorization: Bearer <token>` header, then upserts the user in MongoDB.
 *
 * Attaches `req.user` for downstream middleware and controllers.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing or malformed Authorization header'));
  }

  const idToken = authHeader.slice(7);

  try {
    const decoded = await verifyFirebaseToken(idToken);

    const user = await userRepo.upsertByFirebaseUid({
      firebaseUid: decoded.uid,
      email: decoded.email ?? '',
      displayName: decoded.name ?? decoded.email ?? 'Unknown',
    });

    if (!user.isActive) {
      return next(AppError.forbidden('Account is deactivated'));
    }

    req.user = {
      id: (user._id as { toString(): string }).toString(),
      firebaseUid: user.firebaseUid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
    };

    logger.debug('Authenticated user', { userId: req.user.id, role: req.user.role });
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);

    const message = (err as Error).message ?? 'Token verification failed';
    logger.warn('Firebase token verification failed', { error: message });
    next(AppError.unauthorized('Invalid or expired token'));
  }
}
