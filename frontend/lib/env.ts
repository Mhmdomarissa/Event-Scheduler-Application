/**
 * Environment variables for the client bundle.
 *
 * IMPORTANT: Next.js only inlines NEXT_PUBLIC_* values when accessed as
 * static literals (e.g. process.env.NEXT_PUBLIC_FOO). Dynamic access like
 * process.env[key] is NOT replaced at build time and will always be undefined.
 * That's why each variable is accessed directly below.
 */

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "",
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
} as const;
