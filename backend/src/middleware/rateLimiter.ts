import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

function rateLimitHandler(req: Request, _res: Response): void {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    path: req.path,
    userId: req.user?.id,
  });
}

/**
 * General limiter – applied to /api/events and non-sensitive routes.
 * 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  handler: (req, res, _next, options) => {
    rateLimitHandler(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Strict AI limiter – tighter limits for expensive AI endpoints.
 * 20 requests per 15 minutes per IP.
 */
export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI rate limit exceeded. Please wait before making more requests.' },
  handler: (req, res, _next, options) => {
    rateLimitHandler(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Admin limiter – for admin-only operations.
 * 200 requests per 15 minutes per IP (admins are trusted, but still bounded).
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Admin rate limit exceeded.' },
  handler: (req, res, _next, options) => {
    rateLimitHandler(req, res);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * Auth limiter – protect auth endpoints from brute-force.
 * 30 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  handler: (req, res, _next, options) => {
    rateLimitHandler(req, res);
    res.status(options.statusCode).json(options.message);
  },
});
