/**
 * MSW request handlers for the endpoints that exist on the backend and frontend today (SSOT §8.1).
 *
 * <p>Isomorphic: imports only the `msw` core (`http` / `HttpResponse`), the pure factories and
 * `lib/api`. No `msw/browser` or `msw/node` here, so the same handlers feed both the browser
 * worker (`browser.ts`) and the Node server (`server.ts`) without either pulling the other's
 * platform code.
 *
 * <p>Scope covers the core auth surface (`/auth/me`, `/auth/login`, `/auth/sudo`, etc.) as well as
 * Phase 2 dashboard summary (`/dashboard/summary`, ADM-052) and system health (`/system/health`, ADM-055)
 * endpoints.
 *
 * <p>The response *data* is illustrative fixture content wrapped in the standard `ApiResponse` envelope.
 * The system-health fixture mirrors the backend ADM-047 response contract so the panel exercises
 * the same field names in local development and production.
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
  // Keep the fixture aligned with the seeded SUPPORT role: recovery is allowed, enforcement is
  // not. This lets the detail-header cluster exercise the real role boundary in local MSW runs.
  permissions: [
    "dashboard:view",
    "user:read",
    "user:verify_email",
    "user:reset_password",
    "user:force_logout",
    "user:warn",
    "user:note:write",
    "event:read",
    "report:read",
  ],
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

  // Opens the sudo window (SSOT §10.7). Keep the expiry fields aligned with SudoResponse so the
  // real ADM-089 client-side window service can be exercised in local development and tests.
  http.post(apiPattern(endpoints.auth.sudo), () =>
    HttpResponse.json(
      apiResponse({
        expiresInSeconds: 300,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      }),
    ),
  ),

  http.post(apiPattern(endpoints.auth.logout), () => HttpResponse.json(apiResponse(null))),

  http.get(apiPattern(endpoints.dashboard.summary), () =>
    HttpResponse.json(
      apiResponse({
        summary: {
          totalUsers: 1284,
          totalUsersDelta: 4.2,
          activeUsers: 1058,
          activeUsersDelta: 2.8,
          newToday: 42,
          newTodayDelta: 12.0,
          dau: 412,
          dauDelta: 1.5,
          dauEstimated: true,
          mau: 980,
          mauDelta: 5.4,
          mauEstimated: true,
          pendingVerification: 117,
          bannedOrSuspended: 24,
        },
        userGrowth: [
          { date: "2026-08-01", count: 1120 },
          { date: "2026-08-02", count: 1150 },
          { date: "2026-08-03", count: 1190 },
          { date: "2026-08-04", count: 1215 },
          { date: "2026-08-05", count: 1240 },
          { date: "2026-08-06", count: 1265 },
          { date: "2026-08-07", count: 1284 },
        ],
        registrations: [
          { date: "2026-08-01", count: 30 },
          { date: "2026-08-02", count: 40 },
          { date: "2026-08-03", count: 25 },
          { date: "2026-08-04", count: 25 },
          { date: "2026-08-05", count: 25 },
          { date: "2026-08-06", count: 19 },
          { date: "2026-08-07", count: 42 },
        ],
        activityTrends: [
          { date: "2026-08-01", dau: 380, mau: 920 },
          { date: "2026-08-02", dau: 390, mau: 935 },
          { date: "2026-08-03", dau: 400, mau: 950 },
          { date: "2026-08-04", dau: 405, mau: 960 },
          { date: "2026-08-05", dau: 410, mau: 970 },
          { date: "2026-08-06", dau: 408, mau: 975 },
          { date: "2026-08-07", dau: 412, mau: 980 },
        ],
        statusSplit: [
          { status: "ACTIVE", count: 1058 },
          { status: "PENDING", count: 117 },
          { status: "SUSPENDED", count: 18 },
          { status: "BANNED", count: 6 },
          { status: "DELETED", count: 85 },
        ],
        recentAdminActions: [
          {
            id: "act-1",
            actorEmail: "sok.dara@genlink.kh",
            action: "USER_SUSPEND",
            target: "chan.vibol@gmail.com",
            timestamp: "2026-08-10T08:15:00.000Z",
          },
          {
            id: "act-2",
            actorEmail: "admin@genlink.kh",
            action: "ROLE_UPDATE",
            target: "leang.sovon@genlink.kh",
            timestamp: "2026-08-10T07:45:00.000Z",
          },
          {
            id: "act-3",
            actorEmail: "sok.dara@genlink.kh",
            action: "VERIFY_EMAIL",
            target: "morm.rotana@rupp.edu.kh",
            timestamp: "2026-08-10T06:30:00.000Z",
          },
          {
            id: "act-4",
            actorEmail: "admin@genlink.kh",
            action: "MFA_RESET",
            target: "chean.sophea@rupp.edu.kh",
            timestamp: "2026-08-10T05:10:00.000Z",
          },
          {
            id: "act-5",
            actorEmail: "sok.dara@genlink.kh",
            action: "USER_UNBAN",
            target: "khem.panha@cadt.edu.kh",
            timestamp: "2026-08-09T18:20:00.000Z",
          },
        ],
        recentRegistrations: [
          {
            id: "reg-1",
            fullName: "Morm Rotana",
            email: "morm.rotana@rupp.edu.kh",
            universityName: "Royal University of Phnom Penh",
            status: "PENDING",
            joinedAt: "2026-08-10T08:30:00.000Z",
          },
          {
            id: "reg-2",
            fullName: "Keo Bopha",
            email: "keo.bopha@itc.edu.kh",
            universityName: "Institute of Technology of Cambodia",
            status: "ACTIVE",
            joinedAt: "2026-08-10T08:00:00.000Z",
          },
          {
            id: "reg-3",
            fullName: "Chean Sophea",
            email: "chean.sophea@rupp.edu.kh",
            universityName: "Royal University of Phnom Penh",
            status: "ACTIVE",
            joinedAt: "2026-08-10T07:15:00.000Z",
          },
          {
            id: "reg-4",
            fullName: "Khem Panha",
            email: "khem.panha@cadt.edu.kh",
            universityName: "Cambodia Academy of Digital Technology",
            status: "ACTIVE",
            joinedAt: "2026-08-10T06:40:00.000Z",
          },
          {
            id: "reg-5",
            fullName: "Vong Sothea",
            email: "vong.sothea@num.edu.kh",
            universityName: "National University of Management",
            status: "PENDING",
            joinedAt: "2026-08-10T05:55:00.000Z",
          },
        ],
      }),
    ),
  ),

  http.get(apiPattern(endpoints.system.health), () =>
    HttpResponse.json(
      apiResponse({
        status: "UP",
        checkedAt: "2026-08-10T16:50:00.000Z",
        uptimeSeconds: 86400,
        api: { status: "UP" },
        database: { status: "UP" },
        storage: { status: "UP" },
        mail: { status: "UP", enabled: true, lastOutcome: "SUCCESS" },
        scheduledJobs: [
          {
            name: "AccountAnonymizationJob",
            lastRun: "2026-08-10T02:00:00.000Z",
            lastOutcome: "SUCCESS",
          },
          {
            name: "RecurringFinanceJob",
            lastRun: "2026-08-10T01:30:00.000Z",
            lastOutcome: "SUCCESS",
          },
          {
            name: "MediaCleanupJob",
            lastRun: null,
            lastOutcome: "NEVER_RUN",
          },
        ],
      }),
    ),
  ),
];
