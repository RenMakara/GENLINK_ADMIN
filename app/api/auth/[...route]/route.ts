import { NextResponse, type NextRequest } from "next/server";

import { serverEnv } from "@/lib/config/env";
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  clearedRefreshCookie,
  csrfCookieOptions,
  csrfTokenMatches,
  newCsrfToken,
  readRefreshToken,
  refreshCookieOptions,
} from "@/lib/server/session-cookies";

/**
 * The only part of the portal that touches the refresh token (SSOT §10.9, §12).
 *
 * <h2>Why a Next route handler and not a direct call to Spring</h2>
 *
 * The refresh token has to be stored somewhere the page's JavaScript cannot read, which means
 * an `httpOnly` cookie, which means something on the server has to set and read it. Spring
 * takes its refresh token from a request *body*, so this layer holds the cookie and forwards
 * the value — the browser never possesses it and an XSS cannot exfiltrate it.
 *
 * <p>That split also decides where CSRF protection belongs: **here**, because this is the only
 * hop where a browser presents a cookie. Spring's endpoint is immune by construction, which is
 * why ADM-029 was re-scoped and SSOT §10.9 amended.
 *
 * <p>Access tokens are returned in the response body and held in memory by the auth provider.
 * They are short-lived (10 minutes) and a page reload legitimately loses them — the refresh
 * cookie is what restores the session.
 */

const REFRESH_TTL_SECONDS = 8 * 60 * 60;

interface Envelope<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
}

interface TokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  recoveryCodesRemaining?: number | null;
}

async function callBackend(path: string, body: unknown, accessToken?: string | null) {
  const response = await fetch(`${serverEnv().ADMIN_API_ORIGIN}/api/v1${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
    // Never cache an auth call, and never let Next try.
    cache: "no-store",
  });
  const envelope = (await response.json().catch(() => null)) as Envelope<TokenPayload> | null;
  return { status: response.status, envelope };
}

/** Strips the refresh token before anything reaches the browser. */
function publicTokenBody(payload: TokenPayload) {
  return {
    accessToken: payload.accessToken,
    expiresInSeconds: payload.expiresInSeconds,
    recoveryCodesRemaining: payload.recoveryCodesRemaining ?? null,
  };
}

function failure(status: number, errorCode: string, message: string) {
  return NextResponse.json({ success: false, errorCode, message }, { status });
}

export async function POST(request: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  const action = route.join("/");

  // Every state-changing handler is gated. Checked before the body is read, so a forged request
  // costs nothing and reaches nothing.
  if (!csrfTokenMatches(request)) {
    return failure(403, "CSRF_TOKEN_INVALID", "Missing or invalid CSRF token. Reload and retry.");
  }

  switch (action) {
    case "verify":
      return handleVerify(request);
    case "refresh":
      return handleRefresh(request);
    case "logout":
      return handleLogout(request);
    default:
      return failure(404, "NOT_FOUND", `Unknown auth route: ${action}`);
  }
}

/**
 * Exchanges a challenge token plus a TOTP or recovery code for a session.
 *
 * <p>The challenge token arrives in the body from the client, which is safe: it authenticates
 * nothing on its own and is refused by every route except this one (SSOT §10.8).
 */
async function handleVerify(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { challengeToken?: string; code?: string }
    | null;

  if (!body?.challengeToken || !body?.code) {
    return failure(400, "VALIDATION_ERROR", "A challenge token and a code are required.");
  }

  const { status, envelope } = await callBackend(
    "/admin/auth/mfa/verify",
    { code: body.code },
    body.challengeToken,
  );

  if (!envelope?.success || !envelope.data) {
    return NextResponse.json(envelope ?? { success: false }, { status });
  }

  const response = NextResponse.json({ success: true, data: publicTokenBody(envelope.data) });
  response.cookies.set({
    ...refreshCookieOptions(REFRESH_TTL_SECONDS),
    value: envelope.data.refreshToken,
  });
  return response;
}

/**
 * Rotates the session using the cookie.
 *
 * <p>The backend revokes the old refresh token as it is spent, so the replacement must reach
 * the cookie or the next refresh fails. Rotation is what makes theft detectable: a stolen token
 * is usable at most once, and using it locks out whoever was slower.
 */
async function handleRefresh(request: NextRequest) {
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) {
    // No cookie is the ordinary "not signed in" state, not an error worth logging as one.
    return failure(401, "UNAUTHORIZED", "No session.");
  }

  const { status, envelope } = await callBackend("/admin/auth/refresh", { refreshToken });

  if (!envelope?.success || !envelope.data) {
    // The cookie is dead — clear it, or the portal retries with it forever.
    const response = NextResponse.json(envelope ?? { success: false }, { status });
    response.cookies.set(clearedRefreshCookie());
    return response;
  }

  const response = NextResponse.json({ success: true, data: publicTokenBody(envelope.data) });
  response.cookies.set({
    ...refreshCookieOptions(REFRESH_TTL_SECONDS),
    value: envelope.data.refreshToken,
  });
  return response;
}

/**
 * Ends the session.
 *
 * <p>The cookie is cleared whatever the backend says. A logout that leaves a credential behind
 * because the API was briefly unreachable is worse than one that revokes locally and lets the
 * token expire on its own.
 */
async function handleLogout(request: NextRequest) {
  const refreshToken = readRefreshToken(request);
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;

  if (refreshToken) {
    await callBackend("/admin/auth/logout", { refreshToken }, accessToken).catch(() => null);
  }

  const response = NextResponse.json({ success: true, data: null });
  response.cookies.set(clearedRefreshCookie());
  return response;
}

/**
 * Issues the CSRF token.
 *
 * <p>A GET so it can be fetched on load without needing a token of its own — otherwise you need
 * a token to make a request and a request to get a token.
 *
 * <h2>Returns the existing token when there is one</h2>
 *
 * An earlier version minted a fresh token on every call, on the reasoning that rotation
 * shortens the window in which a leaked one is useful. That was wrong, and actively harmful:
 * two concurrent callers each rotated the cookie, so whichever finished first held a token the
 * cookie no longer matched. Its next request answered 403, which cleared the cached token,
 * which triggered another fetch — a loop that fired thirteen requests on one page load.
 *
 * <p>A double-submit token does not need per-request rotation. Its security comes from a
 * cross-origin page being unable to read it, which is true for as long as it exists. It is
 * per-session, replaced on sign-out.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ route: string[] }> }) {
  const { route } = await context.params;
  if (route.join("/") !== "csrf") {
    return failure(404, "NOT_FOUND", "Unknown auth route.");
  }

  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  const token = existing ?? newCsrfToken();
  const response = NextResponse.json({ success: true, data: { token, header: CSRF_HEADER } });
  if (!existing) {
    response.cookies.set({ ...csrfCookieOptions(), name: CSRF_COOKIE, value: token });
  }
  return response;
}
