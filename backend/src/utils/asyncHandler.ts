import { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler so Express 5's error handling works
 * without try/catch in every controller method.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
