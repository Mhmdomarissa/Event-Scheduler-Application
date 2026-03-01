import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5_000;

let retryCount = 0;

async function connectWithRetry(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    await mongoose.connect(uri, {
      // Mongoose 8 uses the new connection string options
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
    });
    logger.info('MongoDB connected', { uri: uri.replace(/:\/\/[^@]+@/, '://***@') });
    retryCount = 0;
  } catch (error) {
    retryCount += 1;
    logger.error('MongoDB connection failed', { error, attempt: retryCount, maxRetries: MAX_RETRIES });

    if (retryCount < MAX_RETRIES) {
      logger.info(`Retrying MongoDB connection in ${RETRY_INTERVAL_MS / 1000}s…`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      return connectWithRetry();
    }

    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
  }
}

export async function connectDatabase(): Promise<void> {
  // Mongoose event listeners for ongoing connection monitoring
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected – attempting reconnect');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error', { error: err });
  });

  return connectWithRetry();
}

/**
 * Returns true when the mongoose connection is in "connected" readyState (1).
 * Used by the /health endpoint.
 */
export function isDatabaseHealthy(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
