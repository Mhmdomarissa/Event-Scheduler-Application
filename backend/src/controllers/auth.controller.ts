import { Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';

export class AuthController {
  /**
   * GET /api/auth/me
   * Returns the authenticated user's profile and role.
   */
  getMe(req: Request, res: Response): void {
    if (!req.user) throw AppError.unauthorized('Not authenticated');

    sendSuccess(res, req.user, 'User profile retrieved');
  }
}
