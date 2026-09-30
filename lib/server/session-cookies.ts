import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/lib/config/env";

/** Refresh and CSRF cookies used by the auth route handlers. */

export const REFRESH_COOKIE = "genlink_admin_refresh";
export const CSRF_COOKIE = "genlink_admin_csrf";
export const CSRF_HEADER = "x-csrf-token";

/** Uses strict same-site cookies and an environment-controlled Secure flag. */
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

/** Readable CSRF cookie echoed by the page in a request header. */
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

/** Requires matching CSRF cookie and header values, compared in constant time. */
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
