import 'dotenv/config';
import http from 'http';
import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

let server: http.Server;

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to MongoDB before accepting traffic
    await connectDatabase();

    // 2. Start HTTP server
    server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`, {
        env: process.env.NODE_ENV ?? 'development',
        port: PORT,
      });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`, { error: err.message });
      } else {
        logger.error('HTTP server error', { error: err.message });
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: (err as Error).message });
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received – initiating graceful shutdown`);

  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  await disconnectDatabase();
  logger.info('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception – shutting down', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});

void bootstrap();
