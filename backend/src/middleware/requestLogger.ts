import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * requestLogger – logs HTTP method, path, status code, latency, and userId.
 * Deliberately NEVER logs raw Authorization headers, tokens, or passwords.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startHrTime) / 1_000_000;

    const logPayload = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latencyMs: Math.round(durationMs),
      userId: req.user?.id ?? 'unauthenticated',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    };

    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logPayload);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logPayload);
    } else {
      logger.info('HTTP Request', logPayload);
    }
  });

  next();
}
