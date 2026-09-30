import { NextResponse, type NextRequest } from "next/server";

import { isProtectedRoute, loginUrlFor } from "@/lib/auth/routes";
import { REFRESH_COOKIE } from "@/lib/server/session-cookies";

/** Sends visitors without a refresh cookie to sign-in. APIs enforce access. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }
  // Leave cookie validation to AuthGuard; refresh rotates the token.
  if (request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.next();
  }

  const destination = loginUrlFor(pathname, search);

  /* Clone NextURL to preserve the configured basePath in the redirect. */
  const target = new URL(destination, request.nextUrl.origin);
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = target.pathname;
  redirectTo.search = target.search;

  return NextResponse.redirect(redirectTo);
}

/** Signed-in admins may open `/login` to switch accounts. */

export const config = {
  /** Excludes auth handlers and static assets from route protection. */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|eot)$).*)",
  ],
};
