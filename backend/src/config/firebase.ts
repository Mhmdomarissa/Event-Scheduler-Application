import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let app: admin.app.App | null = null;

/**
 * Lazy-initialise Firebase Admin SDK.
 *
 * Supports two modes:
 *   1. A service-account JSON provided via FIREBASE_SERVICE_ACCOUNT_JSON env var (stringified).
 *   2. Application Default Credentials (ADC) used when running on Google Cloud / Cloud Run.
 *
 * The function is idempotent – calling it multiple times always returns the same app instance.
 */
export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      logger.info('Firebase Admin initialised with service account cert');
    } catch (err) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: ${(err as Error).message}`);
    }
  } else {
    // Fallback: Application Default Credentials (GCP / emulator)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) {
      logger.warn(
        'Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_PROJECT_ID are set. ' +
          'Firebase Admin will use Application Default Credentials.',
      );
    }

    app = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    logger.info('Firebase Admin initialised with Application Default Credentials');
  }

  return app;
}

/**
 * Verify a Firebase ID token and return the decoded payload.
 * Throws if the token is invalid or expired.
 */
export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const adminApp = getFirebaseAdmin();
  return adminApp.auth().verifyIdToken(idToken, /* checkRevoked= */ true);
}
