import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — intentionally a pass-through.
 *
 * Firebase JS SDK stores auth state in IndexedDB, NOT cookies.
 * Checking cookies here would cause an infinite redirect loop because
 * the login page sets no cookie after a successful sign-in.
 *
 * Auth protection is handled client-side by <AppShell>, which reads
 * the Firebase SDK state via useAuth and redirects unauthenticated
 * users to /login.
 */
export function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
