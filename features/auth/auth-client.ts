import { env } from "@/lib/config/env";

/**
 * Calls to the Next route handlers that own the refresh cookie.
 *
 * <p>Separate from `lib/api/client`, which talks to Spring. These three requests are the only
 * ones that carry a cookie, so they are the only ones that need a CSRF token — and they must
 * not go through the Spring client's 401-refresh loop, since they *are* the refresh.
 */

/**
 * Route handlers live under the portal's base path.
 *
 * <p>`fetch("/api/auth/refresh")` would resolve against the origin root and miss `/admin`
 * entirely, producing a 404 that looks like an expired session.
 */
function authUrl(path: string): string {
  return `${env.NEXT_PUBLIC_BASE_PATH}/api/auth/${path}`;
}

let csrfToken: string | null = null;
let csrfHeader = "x-csrf-token";

/**
 * Fetches a CSRF token if we do not hold one.
 *
 * <p>Cached for the tab's lifetime: the cookie is rotated per fetch, so requesting one per
 * request would invalidate the token any in-flight request was about to use.
 */
let csrfInFlight: Promise<string> | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  // Single-flighted for the same reason as the refresh below: two callers arriving together
  // would otherwise each fetch, and before the endpoint was fixed each fetch rotated the cookie
  // out from under the other.
  csrfInFlight ??= (async () => {
    const response = await fetch(authUrl("csrf"), {
      credentials: "same-origin",
      cache: "no-store",
    });
    const body = (await response.json()) as { data?: { token: string; header: string } };
    if (!body.data?.token) {
      throw new Error("Could not obtain a CSRF token");
    }
    csrfToken = body.data.token;
    csrfHeader = body.data.header;
    return csrfToken;
  })().finally(() => {
    csrfInFlight = null;
  });

  return csrfInFlight;
}

/** Dropped on sign-out so the next session starts with a fresh token. */
export function resetCsrfToken(): void {
  csrfToken = null;
  csrfInFlight = null;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  message?: string;
}

export interface SessionTokens {
  accessToken: string;
  expiresInSeconds: number;
  recoveryCodesRemaining: number | null;
}

async function post<T>(path: string, body: unknown, accessToken?: string | null): Promise<Envelope<T>> {
  const token = await ensureCsrfToken();
  const response = await fetch(authUrl(path), {
    method: "POST",
    // same-origin, not include: the cookie is same-origin by construction and `include`
    // would send it cross-origin if this code were ever reused against another host.
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      [csrfHeader]: token,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

  if (response.status === 403) {
    // The token was rotated by another tab or the page has been open a long time. Drop it and
    // let the caller retry rather than reporting a CSRF failure as a lost session.
    resetCsrfToken();
  }
  return (await response.json().catch(() => ({ success: false }))) as Envelope<T>;
}

/** Exchanges a challenge token and a TOTP or recovery code for a session. */
export async function verifyMfa(challengeToken: string, code: string): Promise<Envelope<SessionTokens>> {
  return post<SessionTokens>("verify", { challengeToken, code });
}

/**
 * Rotates the session using the refresh cookie — **at most once at a time**.
 *
 * <h2>Why this must be single-flighted here</h2>
 *
 * The backend rotates on every refresh: the token presented is revoked as it is spent, and
 * presenting a revoked one again is treated as theft, which revokes every token on the account
 * (ADM-024). So two concurrent refreshes are not merely wasteful — the second one logs the
 * admin out and looks exactly like an attack in the audit log.
 *
 * <p>Two callers race by default:
 * <ul>
 *   <li><strong>React StrictMode</strong> double-invokes effects in development, so the
 *       provider's bootstrap fires twice on every page load. Both send the same cookie, because
 *       neither has seen the other's `Set-Cookie` yet.</li>
 *   <li>A dashboard firing several queries at once produces several simultaneous 401s.</li>
 * </ul>
 *
 * <p>`lib/api/client.ts` already guards the second case, but the bootstrap calls this directly
 * and bypassed it — which is why a browser refresh reported "Refresh token reuse detected" and
 * ended the session. Guarding at the source covers both, and any future caller.
 */
let refreshInFlight: Promise<Envelope<SessionTokens>> | null = null;

export async function refreshSession(): Promise<Envelope<SessionTokens>> {
  // Cleared once settled, so a *later* expiry can refresh again — holding the resolved promise
  // would make every future refresh reuse a stale answer.
  refreshInFlight ??= post<SessionTokens>("refresh", {}).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** Test seam. */
export function resetRefreshInFlight(): void {
  refreshInFlight = null;
}

export async function endSession(accessToken: string | null): Promise<void> {
  await post("logout", {}, accessToken).catch(() => undefined);
  resetCsrfToken();
}

/**
 * The password step, called straight against Spring rather than through a route handler.
 *
 * <p>No cookie is involved — it answers with a challenge token that authenticates nothing — so
 * there is nothing here for CSRF to protect and no reason to add a hop.
 *
 * <p><strong>A 401 is the success case.</strong> The caller has proved a password and holds a
 * challenge; they are not authenticated yet, and the status code says exactly that
 * (SSOT §8 C-2).
 */
export interface ChallengeResult {
  ok: boolean;
  challengeToken?: string;
  enrolmentRequired?: boolean;
  errorCode?: string;
  status?: number;
}

export async function requestChallenge(email: string, password: string): Promise<ChallengeResult> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ email, password }),
  });

  const body = (await response.json().catch(() => null)) as
    | { data?: { challengeToken: string; enrolmentRequired: boolean }; errorCode?: string }
    | null;

  if (body?.data?.challengeToken) {
    return {
      ok: true,
      challengeToken: body.data.challengeToken,
      enrolmentRequired: body.data.enrolmentRequired,
    };
  }
  return { ok: false, errorCode: body?.errorCode, status: response.status };
}
