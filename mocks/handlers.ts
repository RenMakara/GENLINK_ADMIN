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

import { apiError, apiResponse, pageResponse } from "./factories";

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
  // The fixture keeps the recovery boundary used by the user detail tests while also allowing
  // the local Roles/Admin Users pages to exercise their read/manage states without a separate
  // login fixture. The deployed backend remains authoritative for the real role permissions.
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
    "rbac:read",
    "rbac:manage",
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

  // ADM-092 recovery actions. The real endpoints are permission-gated; the local fixture keeps
  // the happy path available so the detail action dialogs can be exercised without a backend.
  http.post(apiPattern("/admin/users/:userId/verify-email"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  http.post(apiPattern("/admin/users/:userId/reset-password"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  http.post(apiPattern("/admin/users/:userId/force-logout"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  // ADM-093 lifecycle actions. Delete and restore are still protected by the real API's
  // permission and sudo gates; the local fixture only supplies the successful transport shape.
  http.delete(apiPattern("/admin/users/:userId"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  http.post(apiPattern("/admin/users/:userId/restore"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  // ADM-094 XP adjustment action. The real endpoint remains permission-gated by XP direction;
  // local development uses a successful signed-adjustment fixture for the dialog flow.
  http.post(apiPattern("/admin/users/:userId/xp"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        userId: String(params.userId),
        requestedAmount: 100,
        appliedAmount: 100,
        totalXp: 100,
        level: 2,
      }),
    ),
  ),

  // ADM-095 per-user enforcement timeline and sanction lift contract.
  http.get(apiPattern("/admin/users/:userId/sanctions"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        content: [
          {
            sanctionId: "mock-sanction-1",
            userId: String(params.userId),
            userFullName: "Dara Sok",
            type: "WARNING",
            severity: "MEDIUM",
            reason: "Repeatedly posted content outside the community guidelines",
            messageEn: "Please review the community guidelines before posting again.",
            messageKm: null,
            previousStatus: "ACTIVE",
            startsAt: "2026-09-23T03:00:00Z",
            expiresAt: null,
            acknowledgedAt: null,
            liftedAt: null,
            liftReason: null,
            issuedByAdminId: "mock-admin-1",
            issuedByAdminName: "Sok Dara",
            liftedByAdminId: null,
            liftedByAdminName: null,
            active: true,
          },
        ],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      }),
    ),
  ),

  http.post(apiPattern("/admin/sanctions/:sanctionId/lift"), () =>
    HttpResponse.json(apiResponse(null)),
  ),

  // ADM-096 warning recording and staff-only append-only notes contracts.
  http.post(apiPattern("/admin/users/:userId/warnings"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        warningId: "mock-warning-1",
        userId: String(params.userId),
        severity: "MEDIUM",
        messageEn: "Please review the community guidelines before posting again.",
        messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍ មុនពេលបង្ហោះម្តងទៀត។",
        delivered: false,
        deliveryStatus: "NOT_DELIVERED",
        recordedAt: "2026-09-24T03:00:00Z",
      }),
    ),
  ),

  http.get(apiPattern("/admin/users/:userId/notes"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        content: [
          {
            noteId: "mock-note-1",
            userId: String(params.userId),
            adminUserId: "mock-admin-1",
            note: "Follow-up requested after the account review.",
            createdAt: "2026-09-24T03:00:00Z",
          },
        ],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      }),
    ),
  ),

  http.post(apiPattern("/admin/users/:userId/notes"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        noteId: "mock-note-2",
        userId: String(params.userId),
        adminUserId: "mock-admin-1",
        note: "New internal note.",
        createdAt: "2026-09-24T04:00:00Z",
      }),
    ),
  ),

  http.get(apiPattern("/admin/sanctions"), () =>
    HttpResponse.json(
      apiResponse({
        content: [
          {
            sanctionId: "mock-global-sanction-1",
            userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
            userFullName: "Dara Sok",
            type: "WARNING",
            severity: "MEDIUM",
            reason: "Repeatedly posted content outside the community guidelines",
            messageEn: "Please review the community guidelines before posting again.",
            messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍ មុនពេលបង្ហោះម្តងទៀត។",
            previousStatus: "ACTIVE",
            startsAt: "2026-09-23T03:00:00Z",
            expiresAt: null,
            acknowledgedAt: null,
            liftedAt: null,
            liftReason: null,
            issuedByAdminId: "mock-admin-1",
            issuedByAdminName: "Sok Dara",
            liftedByAdminId: null,
            liftedByAdminName: null,
            active: true,
          },
        ],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
      }),
    ),
  ),

  // ADM-098 bulk-action contracts. The fixture returns the same fixed C-3 shape as the backend;
  // feature tests override these handlers when they need a partial-success response.
  http.get(apiPattern(endpoints.badges.list), () =>
    HttpResponse.json(
      apiResponse([
        {
          badgeId: "mock-badge-1",
          nameEn: "Helpful",
          nameKm: "មានប្រយោជន៍",
          descriptionEn: "Helpful contribution",
          descriptionKm: null,
          requirement: "Verified contribution",
          iconUrl: null,
        },
      ]),
    ),
  ),

  http.get(apiPattern(endpoints.notifications.templates), () =>
    HttpResponse.json(
      apiResponse([
        {
          id: "mock-template-1",
          templateKey: "ADMIN_ACCOUNT_REVIEW",
          titleEn: "Account review",
          titleKm: "ពិនិត្យគណនី",
          messageEn: "Please review your account.",
          messageKm: "សូមពិនិត្យគណនីរបស់អ្នក។",
          createdAt: "2026-08-10T02:00:00.000Z",
          updatedAt: "2026-08-10T02:00:00.000Z",
        },
      ]),
    ),
  ),

  http.post(apiPattern(endpoints.users.bulk.ban), async ({ request }) => {
    const body = (await request.json()) as { batchId: string; userIds: string[] };
    return HttpResponse.json(
      apiResponse({
        batchId: body.batchId,
        requested: body.userIds.length,
        succeeded: body.userIds.length,
        failed: [],
      }),
    );
  }),

  http.post(apiPattern(endpoints.users.bulk.notify), async ({ request }) => {
    const body = (await request.json()) as { batchId: string; userIds: string[] };
    return HttpResponse.json(
      apiResponse({
        batchId: body.batchId,
        requested: body.userIds.length,
        succeeded: body.userIds.length,
        failed: [],
      }),
    );
  }),

  http.post(apiPattern(endpoints.users.bulk.badges), async ({ request }) => {
    const body = (await request.json()) as { batchId: string; userIds: string[] };
    return HttpResponse.json(
      apiResponse({
        batchId: body.batchId,
        requested: body.userIds.length,
        succeeded: body.userIds.length,
        failed: [],
      }),
    );
  }),

  // ADM-107 roles list. The real endpoint remains gated by rbac:read; this fixture keeps the
  // summary projection available for local table development and component tests.
  http.get(apiPattern(endpoints.roles.list), () =>
    HttpResponse.json(
      apiResponse([
        {
          roleId: "mock-role-super-admin",
          code: "SUPER_ADMIN",
          name: "Super Admin",
          description: "Owner. Manages admins and system settings.",
          isSystem: true,
          adminCount: 1,
        },
        {
          roleId: "mock-role-support",
          code: "SUPPORT",
          name: "Support",
          description: "Unblocks users; cannot punish them.",
          isSystem: true,
          adminCount: 2,
        },
      ]),
    ),
  ),

  // ADM-108 role detail, permission catalogue, and whole-set replacement contracts. The live
  // backend remains authoritative for rbac:read/rbac:manage, sudo, validation, and auditing.
  http.get(apiPattern("/admin/roles/:roleId"), ({ params }) => {
    const roleId = String(params.roleId);
    const isSuperAdmin = roleId === "mock-role-super-admin";
    const permissions = [
      "dashboard:view",
      "user:read",
      "user:verify_email",
      "user:reset_password",
      "user:force_logout",
    ];
    const catalogue = [
      "dashboard:view",
      "analytics:view",
      "analytics:export",
      "user:read",
      "user:update",
      "user:export",
      "user:ban",
      "user:unban",
      "user:verify_email",
      "user:reset_password",
      "user:force_logout",
      "user:delete",
      "rbac:read",
      "rbac:manage",
    ];

    return HttpResponse.json(
      apiResponse({
        roleId,
        code: isSuperAdmin ? "SUPER_ADMIN" : "SUPPORT",
        name: isSuperAdmin ? "Super Admin" : "Support",
        description: isSuperAdmin
          ? "Owner. Manages admins and system settings."
          : "Unblocks users; cannot punish them.",
        isSystem: true,
        adminCount: isSuperAdmin ? 1 : 2,
        permissions: isSuperAdmin ? catalogue : permissions,
      }),
    );
  }),

  http.get(apiPattern(endpoints.roles.permissions), () =>
    HttpResponse.json(
      apiResponse([
        {
          resource: "dashboard",
          permissions: [
            {
              code: "dashboard:view",
              resource: "dashboard",
              action: "view",
              description: "View the admin dashboard",
            },
          ],
        },
        {
          resource: "analytics",
          permissions: [
            {
              code: "analytics:view",
              resource: "analytics",
              action: "view",
              description: "View analytics dashboards",
            },
            {
              code: "analytics:export",
              resource: "analytics",
              action: "export",
              description: "Export analytics series as CSV",
            },
          ],
        },
        {
          resource: "user",
          permissions: [
            {
              code: "user:read",
              resource: "user",
              action: "read",
              description: "View user records",
            },
            {
              code: "user:update",
              resource: "user",
              action: "update",
              description: "Correct user profile fields",
            },
            {
              code: "user:export",
              resource: "user",
              action: "export",
              description: "Export the user list as CSV",
            },
            {
              code: "user:ban",
              resource: "user",
              action: "ban",
              description: "Ban a user permanently",
            },
            {
              code: "user:unban",
              resource: "user",
              action: "unban",
              description: "Lift a ban",
            },
            {
              code: "user:verify_email",
              resource: "user",
              action: "verify_email",
              description: "Manually mark an email verified",
            },
            {
              code: "user:reset_password",
              resource: "user",
              action: "reset_password",
              description: "Trigger a password-reset email",
            },
            {
              code: "user:force_logout",
              resource: "user",
              action: "force_logout",
              description: "Revoke a user's sessions",
            },
            {
              code: "user:delete",
              resource: "user",
              action: "delete",
              description: "Soft-delete and restore a user account",
            },
          ],
        },
        {
          resource: "rbac",
          permissions: [
            {
              code: "rbac:read",
              resource: "rbac",
              action: "read",
              description: "View roles, permissions and admin users",
            },
            {
              code: "rbac:manage",
              resource: "rbac",
              action: "manage",
              description: "Change roles, permissions and admin users",
            },
          ],
        },
      ]),
    ),
  ),

  http.put(apiPattern("/admin/roles/:roleId/permissions"), async ({ params, request }) => {
    const roleId = String(params.roleId);
    const body = (await request.json()) as { permissions?: string[] };
    const isSuperAdmin = roleId === "mock-role-super-admin";
    return HttpResponse.json(
      apiResponse({
        roleId,
        code: isSuperAdmin ? "SUPER_ADMIN" : "SUPPORT",
        name: isSuperAdmin ? "Super Admin" : "Support",
        description: isSuperAdmin
          ? "Owner. Manages admins and system settings."
          : "Unblocks users; cannot punish them.",
        isSystem: true,
        adminCount: isSuperAdmin ? 1 : 2,
        permissions: body.permissions ?? [],
      }),
    );
  }),

  // ADM-109 staff directory and its existing ADM-103/104 action contracts. Mutation handlers
  // return the same safe projection as the real backend; tests override them for failures.
  http.get(apiPattern(endpoints.admins.list), () =>
    HttpResponse.json(
      apiResponse(
        pageResponse([
          {
            adminId: "mock-admin-super",
            userId: "mock-user-super",
            fullName: "Sok Dara",
            username: "sokdara",
            email: "admin@genlink.kh",
            roleId: "mock-role-super-admin",
            roleCode: "SUPER_ADMIN",
            roleName: "Super Admin",
            active: true,
            totpEnabled: true,
            totpConfirmed: true,
            lastLoginAt: "2026-09-24T02:30:00.000Z",
            createdAt: "2026-01-10T02:30:00.000Z",
            deletedAt: null,
          },
          {
            adminId: "mock-admin-support",
            userId: "mock-user-support",
            fullName: "Malis Chan",
            username: "malischan",
            email: "malis@genlink.kh",
            roleId: "mock-role-support",
            roleCode: "SUPPORT",
            roleName: "Support",
            active: true,
            totpEnabled: true,
            totpConfirmed: false,
            lastLoginAt: null,
            createdAt: "2026-03-10T02:30:00.000Z",
            deletedAt: null,
          },
          {
            adminId: "mock-admin-revoked",
            userId: "mock-user-revoked",
            fullName: "Vannak Lim",
            username: "vannaklim",
            email: "vannak@genlink.kh",
            roleId: "mock-role-support",
            roleCode: "SUPPORT",
            roleName: "Support",
            active: false,
            totpEnabled: false,
            totpConfirmed: false,
            lastLoginAt: "2026-04-10T02:30:00.000Z",
            createdAt: "2026-02-10T02:30:00.000Z",
            deletedAt: "2026-08-10T02:30:00.000Z",
          },
        ],
        { totalElements: 3 },
      ),
    ),
  ),
  ),

  http.put(apiPattern("/admin/admins/:adminId/role"), async ({ params, request }) => {
    const body = (await request.json()) as { roleId?: string };
    return HttpResponse.json(
      apiResponse({
        adminId: String(params.adminId),
        userId: "mock-user-support",
        fullName: "Malis Chan",
        username: "malischan",
        email: "malis@genlink.kh",
        roleId: body.roleId ?? "mock-role-support",
        roleCode: "ADMIN",
        roleName: "Admin",
        active: true,
        totpEnabled: true,
        totpConfirmed: true,
        lastLoginAt: "2026-09-24T02:30:00.000Z",
        createdAt: "2026-03-10T02:30:00.000Z",
        deletedAt: null,
      }),
    );
  }),

  http.post(apiPattern("/admin/admins/:adminId/deactivate"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        adminId: String(params.adminId),
        userId: "mock-user-support",
        fullName: "Malis Chan",
        username: "malischan",
        email: "malis@genlink.kh",
        roleId: "mock-role-support",
        roleCode: "SUPPORT",
        roleName: "Support",
        active: false,
        totpEnabled: true,
        totpConfirmed: true,
        lastLoginAt: "2026-09-24T02:30:00.000Z",
        createdAt: "2026-03-10T02:30:00.000Z",
        deletedAt: "2026-09-25T02:30:00.000Z",
      }),
    ),
  ),

  http.post(apiPattern("/admin/admins/:adminId/reset-mfa"), ({ params }) =>
    HttpResponse.json(
      apiResponse({
        adminId: String(params.adminId),
        userId: "mock-user-support",
        fullName: "Malis Chan",
        username: "malischan",
        email: "malis@genlink.kh",
        roleId: "mock-role-support",
        roleCode: "SUPPORT",
        roleName: "Support",
        active: true,
        totpEnabled: false,
        totpConfirmed: false,
        lastLoginAt: "2026-09-24T02:30:00.000Z",
        createdAt: "2026-03-10T02:30:00.000Z",
        deletedAt: null,
      }),
    ),
  ),

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
