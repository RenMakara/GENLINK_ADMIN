import { NextResponse, type NextRequest } from "next/server";

import { isProtectedRoute, loginUrlFor } from "@/lib/auth/routes";
import { REFRESH_COOKIE } from "@/lib/server/session-cookies";

/**
 * Server-side first pass on every navigation (ADM-039).
 *
 * <p>Named `proxy`, not `middleware`: Next.js 16 deprecated the `middleware` file convention and
 * renamed it, and its runtime is `nodejs` and not configurable. Confirmed against the local
 * copy of the upgrade guide rather than from memory, as the task requires
 * (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`, "middleware to proxy").
 *
 * <h2>What this adds over the client guard</h2>
 *
 * `AuthGuard` already keeps signed-out visitors out of the shell, but only after React has
 * booted — so opening a bookmarked `/users` with no session means downloading the app, showing
 * "Restoring your session…", and only then bouncing. Redirecting here happens before any of that
 * is sent, so the visitor goes straight to sign-in and the destination is captured server-side
 * (AC#1).
 *
 * <h2>Presence, never validity</h2>
 *
 * <strong>This checks that a refresh cookie exists. It does not check that it works.</strong>
 * Validating would mean calling the backend on every navigation, and the only call that could
 * tell us is `/admin/auth/refresh` — which *spends and rotates* the token. Doing that per
 * navigation would rotate the cookie behind the app's back, and two navigations racing would
 * present the same token twice and trip the backend's reuse detection, revoking the session.
 * That exact loop was already shipped and fixed once (`f59cab0`); it is not being reintroduced
 * as a routing feature.
 *
 * <p>So a stale, expired or revoked cookie passes this check. `AuthGuard` catches it a moment
 * later, when the refresh it was going to make anyway fails. This is a fast path for the common
 * case, not a second gate.
 *
 * <h2>Not a security control</h2>
 *
 * Nothing here authorizes anything (SSOT §5.6, §10.9). Every admin endpoint authenticates and
 * authorizes on its own, and a cookie's presence is not evidence of anything — anyone can set a
 * `genlink_admin_refresh` cookie to the word "hello" and reach the shell, where every request
 * they make answers 401. That is fine. The threat this addresses is a bookmark, not an attacker.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }
  if (request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.next();
  }

  const destination = loginUrlFor(pathname, search);

  /*
   * Built by cloning `nextUrl`, not with `new URL(destination, request.url)`.
   *
   * The portal is served under a basePath (`/admin` by default, SSOT §1.7) and the two disagree
   * about it: `nextUrl.pathname` arrives already stripped — a request for `/admin/users` reads
   * as `/users`, which is what makes the captured destination correct — but `request.url` is the
   * raw URL *including* the prefix, so resolving `/login` against it discards `/admin` and lands
   * on the origin root. Verified in the browser rather than reasoned about: the first version of
   * this line redirected to `http://localhost:3000/login`, which is a 404.
   *
   * A cloned `NextURL` keeps the basePath and re-applies it, so the pathname assigned here stays
   * in the same stripped space the check above used.
   */
  const target = new URL(destination, request.nextUrl.origin);
  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = target.pathname;
  redirectTo.search = target.search;

  return NextResponse.redirect(redirectTo);
}

/**
 * There is deliberately no rule sending a *signed-in* visitor away from `/login`.
 *
 * <p>It reads as an obvious companion to the above and it creates a loop: a visitor with a dead
 * cookie is bounced to the dashboard, the client's refresh fails and returns them to sign-in,
 * where the cookie — not yet cleared, because the redirect happened before any of that ran —
 * bounces them again. It also breaks the legitimate case of an admin opening `/login` on purpose
 * to switch accounts. The proxy only ever blocks; it never redirects anyone who is fine.
 */

export const config = {
  /**
   * Everything except Next's own assets and the auth route handlers.
   *
   * <p>`api` has to be excluded or the refresh call itself would be redirected — it runs before
   * a cookie exists, which is the entire point of it. `_next/static`, `_next/image`, and public
   * static assets are excluded because without a matcher the proxy runs on every request
   * including CSS, JavaScript, images, and fonts, and redirecting those to `/login` breaks the
   * sign-in page it redirects to. Public assets are intentionally non-sensitive; application
   * data remains protected by the API.
   */
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|eot)$).*)",
  ],
};
