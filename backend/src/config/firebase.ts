import admin from 'firebase-admin';
import { logger } from '../utils/logger';

let app: admin.app.App | null = null;

/**
 * Lazy-initialise Firebase Admin SDK.
 *
 * Credential resolution order:
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON env var (full service-account JSON string).
 *   2. Individual vars: FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.
 *   3. Application Default Credentials (ADC) – used when running on Google Cloud / Cloud Run.
 *
 * The function is idempotent – calling it multiple times always returns the same app instance.
 */
export function getFirebaseAdmin(): admin.app.App {
  if (app) return app;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId          = process.env.FIREBASE_PROJECT_ID;
  const clientEmail        = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey         = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // ── Priority 1: full JSON service account ──────────────────────────────
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;
      app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      logger.info('Firebase Admin initialised with service account JSON');
      return app;
    } catch (err) {
      logger.warn(
        `Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON (${(err as Error).message}). ` +
        'Falling back to individual credential vars.',
      );
    }
  }

  // ── Priority 2: individual credential env vars ─────────────────────────
  if (projectId && clientEmail && privateKey) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      } as admin.ServiceAccount),
    });
    logger.info('Firebase Admin initialised with individual credential env vars');
    return app;
  }

  // ── Priority 3: Application Default Credentials ────────────────────────
  if (!projectId) {
    logger.warn(
      'No Firebase credentials found (no FIREBASE_SERVICE_ACCOUNT_JSON, no individual vars). ' +
      'Attempting Application Default Credentials.',
    );
  }
  app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
  logger.info('Firebase Admin initialised with Application Default Credentials');

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
