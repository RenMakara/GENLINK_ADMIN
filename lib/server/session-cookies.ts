import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/config/env";

/**
 * The refresh cookie and the CSRF token, both owned by the route handlers.
 *
 * <p>This module is the only place the refresh token is read or written. The browser never
 * sees it and the React tree never holds it — that is the whole point of putting it in an
 * `httpOnly` cookie rather than `localStorage` (SSOT §10.9). An XSS in an admin panel that
 * reached a token carrying `user:delete` would be about as bad as a bug gets.
 */

export const REFRESH_COOKIE = "genlink_admin_refresh";
export const CSRF_COOKIE = "genlink_admin_csrf";
export const CSRF_HEADER = "x-csrf-token";

/**
 * `SameSite=Strict` is the primary CSRF defence, and it is strict rather than lax because
 * nothing in this portal is reachable by following a link from elsewhere — an admin either
 * signs in or they do not.
 *
 * <p>`Secure` is environment-driven: a `Secure` cookie is silently dropped by the browser over
 * plain HTTP, and the MVP has no TLS (SSOT §10.9.1). It defaults to true, so forgetting to set
 * it breaks sign-in loudly on HTTP rather than shipping insecure cookies quietly on HTTPS.
 */
function baseCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: serverEnv().ADMIN_COOKIE_SECURE,
    path: "/",
  };
}

export function refreshCookieOptions(maxAgeSeconds: number) {
  return { ...baseCookieOptions(), name: REFRESH_COOKIE, maxAge: maxAgeSeconds };
}

/** Same attributes, zero age — the only reliable way to remove a cookie. */
export function clearedRefreshCookie() {
  return { ...baseCookieOptions(), name: REFRESH_COOKIE, value: "", maxAge: 0 };
}

/**
 * The CSRF token cookie. **Not `httpOnly`** — deliberately.
 *
 * <p>A double-submit token only works if the page can read it and echo it in a header. Its
 * secrecy from JavaScript is not what protects anything: the protection is that a *cross-origin*
 * page cannot read it, which the same-origin policy guarantees regardless of `httpOnly`.
 */
export function csrfCookieOptions() {
  return {
    name: CSRF_COOKIE,
    httpOnly: false,
    sameSite: "strict" as const,
    secure: serverEnv().ADMIN_COOKIE_SECURE,
    path: "/",
  };
}

export function newCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Double-submit check: the header must match the cookie.
 *
 * <p>Defence in depth behind `SameSite=Strict`, which is doing the real work here. It exists
 * because `SameSite` is one browser bug or one misconfigured proxy away from being the only
 * thing standing there, and because this is the layer where the browser actually presents a
 * cookie — the Spring API takes its refresh token from a request body and is immune by
 * construction (SSOT §10.9, amended 2026-08-08).
 *
 * <p>Compared in constant time. The window is small, but a token comparison that short-circuits
 * on the first differing byte is a habit worth not forming.
 */
export function csrfTokenMatches(request: NextRequest): boolean {
  const cookie = request.cookies.get(CSRF_COOKIE)?.value;
  const header = request.headers.get(CSRF_HEADER);

  if (!cookie || !header) {
    return false;
  }
  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  if (a.length !== b.length) {
    // timingSafeEqual throws on a length mismatch, and the length is not a secret.
    return false;
  }
  return timingSafeEqual(a, b);
}

export function readRefreshToken(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_COOKIE)?.value ?? null;
}
