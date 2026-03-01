import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { requestLogger } from './middleware/requestLogger';
import { eventRouter } from './routes/event.routes';
import { invitationRouter } from './routes/invitation.routes';
import { aiRouter } from './routes/ai.routes';
import { authRouter } from './routes/auth.routes';
import { AppError } from './utils/AppError';
import { logger } from './utils/logger';
import { isDatabaseHealthy } from './config/database';

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-origin' },
    hidePoweredBy: true,
    hsts: { maxAge: 63_072_000, includeSubDomains: true, preload: true },
    noSniff: true,
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
  }),
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const rawOrigins = process.env.ALLOWED_ORIGINS ?? '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin:
    allowedOrigins.length > 0
      ? (origin, callback) => {
          if (!origin) return callback(null, false); // deny non-browser requests in prod
          if (allowedOrigins.includes(origin)) return callback(null, true);
          logger.warn('CORS blocked request', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      : process.env.NODE_ENV !== 'production'
        ? true // allow all in development when not set
        : false, // deny all in production when not set
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86_400,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// Trust proxy (for express-rate-limit behind load balancer / Nginx)
app.set('trust proxy', 1);

// ── Health endpoint ───────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  const dbHealthy = isDatabaseHealthy();
  const status = dbHealthy ? 'ok' : 'degraded';
  const httpStatus = dbHealthy ? 200 : 503;

  res.status(httpStatus).json({
    success: dbHealthy,
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/events', eventRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/ai', aiRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound('The requested resource does not exist'));
});

// ── Central error handler ─────────────────────────────────────────────────────
// Express 5 passes errors to handlers with 4 arguments: (err, req, res, next)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Unexpected operational error', { error: err.message, stack: err.stack });
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    });
    return;
  }

  // Unknown / unexpected error
  const message = (err as Error)?.message ?? 'An unexpected error occurred';
  logger.error('Unhandled error', { error: message, stack: (err as Error)?.stack });

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: (err as Error)?.stack }),
  });
});

export { app };
