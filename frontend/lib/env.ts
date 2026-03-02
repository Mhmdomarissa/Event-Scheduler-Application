/**
 * Validates all required NEXT_PUBLIC_* environment variables at module load time.
 * Throws early in development so the issue is immediately visible.
 */

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Make sure it is defined in .env.local (dev) or Vercel project settings (prod).`,
    );
  }
  return value;
}

export const env = {
  apiUrl: required("NEXT_PUBLIC_API_URL"),
  firebase: {
    apiKey: required("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: required("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: required("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    appId: required("NEXT_PUBLIC_FIREBASE_APP_ID"),
  },
} as const;
