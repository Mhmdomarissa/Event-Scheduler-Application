import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/events", "/invitations", "/planner"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtected) return NextResponse.next();

  // Check for the Firebase auth session cookie (set by Firebase's session management).
  // Since Firebase uses client-side auth, we rely on a lightweight check:
  // If no auth-related cookie is present at all, redirect immediately.
  // Full verification happens inside pages via useAuth which reads the Firebase SDK state.
  const hasCookie =
    req.cookies.has("__session") ||
    req.cookies.has("firebase-auth-token") ||
    req.headers.get("cookie")?.includes("firebase");

  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
