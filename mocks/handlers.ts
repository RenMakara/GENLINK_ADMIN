/**
 * MSW request handlers for the endpoints that exist on the backend today (SSOT §8.1).
 *
 * <p>Isomorphic: imports only the `msw` core (`http` / `HttpResponse`), the pure factories and
 * `lib/api`. No `msw/browser` or `msw/node` here, so the same handlers feed both the browser
 * worker (`browser.ts`) and the Node server (`server.ts`) without either pulling the other's
 * platform code.
 *
 * <p>Only the auth surface is mocked — the only admin endpoints wired into `endpoints.ts` so
 * far. Later feature tasks add their own handlers alongside these as their endpoints land; an
 * exhaustive map of unbuilt routes would be indistinguishable from a working one.
 *
 * <p>The response *data* is illustrative fixture content; the response *shapes* are the pinned
 * contract (the `ApiResponse` envelope, the error-code catalogue). No DTO field is invented
 * that the SSOT or existing code has not already fixed — the two session shapes below are the
 * real types the client already consumes.
 */

import { http, HttpResponse } from "msw";

import { endpoints } from "@/lib/api/endpoints";
import { env } from "@/lib/config/env";

import { apiError, apiResponse } from "./factories";

// Type-only imports (erased at build): they keep the fixtures honest against the shapes the app
// already reads, without coupling this module to the feature's runtime code.
import type { AdminSession } from "@/features/auth/auth-provider";
import type { SessionTokens } from "@/features/auth/auth-client";

/**
 * Turns an endpoint path into a host-agnostic MSW pattern.
 *
 * <p>`endpoints.ts` holds paths relative to `NEXT_PUBLIC_API_BASE_URL` (`/api/v1` under the
 * MVP's path-based routing). A handler has to match the *full* request URL, so the base path is
 * prefixed here — and with a leading `*` wildcard so the same pattern matches whatever origin
 * the request resolves against: `http://localhost:3000` in the browser, an absolute test host
 * under Node. The base is read through `env`, never `process.env` (SSOT §1.7); its path portion
 * is taken even when it is an absolute URL, so a future subdomain split needs no change here.
 *
 * <p>Exported so a feature test can attach one of the {@link errorResponses} to the same
 * endpoint the app calls — `server.use(http.post(apiPattern(endpoints.x), errorResponses.y))` —
 * without re-deriving the URL and drifting from what the handlers match.
 */
export function apiPattern(endpoint: string): string {
  const base = env.NEXT_PUBLIC_API_BASE_URL;
  const basePath = base.startsWith("/") ? base : new URL(base).pathname;
  return `*${basePath}${endpoint}`;
}

/** The resolved admin the frontend reads from `/auth/me`. Shape is the real `AdminSession`. */
const SESSION: AdminSession = {
  adminUserId: "11111111-1111-1111-1111-111111111111",
  email: "admin@genlink.kh",
  fullName: "Sok Dara",
  roleCode: "SUPPORT",
  roleName: "Support",
  permissions: ["dashboard:view", "user:read"],
  lastLoginAt: "2026-08-10T02:30:00.000Z",
  totpEnabled: true,
};

/** A session-token bundle, as `/mfa/verify` and `/refresh` return it. */
const TOKENS: SessionTokens = {
  accessToken: "mock.access.token",
  expiresInSeconds: 900,
  recoveryCodesRemaining: 8,
};

/**
 * The four failure fixtures the mock layer must be able to produce (SSOT §8 C-2), exported as
 * reusable response builders. A feature test attaches one to its endpoint with `server.use(...)`
 * to exercise the UI's error path; the mock layer *fails the way the API fails* rather than only
 * ever answering `200`.
 */
export const errorResponses = {
  /** 403 — missing permission (SSOT §8 C-1: admin routes return 403, not 404). */
  forbidden: () => HttpResponse.json(apiError("FORBIDDEN"), { status: 403 }),
  /** 403 — high-tier action needs step-up re-auth (SSOT §10.7). */
  sudoRequired: () => HttpResponse.json(apiError("ADMIN_SUDO_REQUIRED"), { status: 403 }),
  /** 429 — rate limited (SSOT §10.6). */
  rateLimited: () => HttpResponse.json(apiError("RATE_LIMITED"), { status: 429 }),
  /** 400 — request failed Jakarta validation. */
  validationError: () => HttpResponse.json(apiError("VALIDATION_ERROR"), { status: 400 }),
} as const;

/**
 * Happy-path handlers for the live auth endpoints. Success only — failures are opt-in through
 * `errorResponses` so development runs against a working session by default.
 */
export const handlers = [
  http.get(apiPattern(endpoints.auth.me), () => HttpResponse.json(apiResponse(SESSION))),

  http.post(apiPattern(endpoints.auth.login), () =>
    HttpResponse.json(apiResponse({ challengeToken: "mock.challenge.token", enrolmentRequired: false })),
  ),

  http.post(apiPattern(endpoints.auth.verifyMfa), () => HttpResponse.json(apiResponse(TOKENS))),

  http.post(apiPattern(endpoints.auth.refresh), () => HttpResponse.json(apiResponse(TOKENS))),

  http.post(apiPattern(endpoints.auth.enrolMfa), () =>
    HttpResponse.json(
      apiResponse({
        secret: "JBSWY3DPEHPK3PXP",
        otpauthUri: "otpauth://totp/GenLink%20Admin:admin@genlink.kh?secret=JBSWY3DPEHPK3PXP&issuer=GenLink%20Admin",
      }),
    ),
  ),

  http.post(apiPattern(endpoints.auth.confirmMfa), () =>
    HttpResponse.json(
      apiResponse({
        recoveryCodes: Array.from({ length: 10 }, (_, i) => `MOCK-${String(i + 1).padStart(4, "0")}`),
      }),
    ),
  ),

  // Opens the sudo window (SSOT §10.7). The response body is unspecified beyond success, so no
  // fields are invented — the envelope carries no data.
  http.post(apiPattern(endpoints.auth.sudo), () => HttpResponse.json(apiResponse(null))),

  http.post(apiPattern(endpoints.auth.logout), () => HttpResponse.json(apiResponse(null))),
];
