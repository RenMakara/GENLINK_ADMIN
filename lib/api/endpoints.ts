/**
 * Every admin endpoint, in one place.
 *
 * Paths live here rather than inline at call sites so a route change is one edit, and so
 * the set of things the portal talks to is readable at a glance. Paths are relative to
 * `NEXT_PUBLIC_API_BASE_URL`; nothing here names a host.
 *
 * Most entries are deployed backend endpoints. A small number of explicitly labelled contract
 * routes are included when the frontend is intentionally working ahead of its backend task; the
 * label keeps those routes distinguishable from live APIs at the call site.
 */

const ADMIN = "/admin";

export const endpoints = {
  auth: {
    /** password step; issues an MFA challenge, not a session. */
    login: `${ADMIN}/auth/login`,
    /** begins enrolment; returns the secret and otpauth:// URI once. */
    enrolMfa: `${ADMIN}/auth/mfa/enrol`,
    /** confirms the first code and returns the recovery codes, once. */
    confirmMfa: `${ADMIN}/auth/mfa/confirm`,
    /** TOTP or recovery code; issues the real tokens. */
    verifyMfa: `${ADMIN}/auth/mfa/verify`,
    /** rotates the access token using the refresh cookie. */
    refresh: `${ADMIN}/auth/refresh`,
    logout: `${ADMIN}/auth/logout`,
    /** identity, role and the resolved permission list. */
    me: `${ADMIN}/auth/me`,
    /** opens the 5-minute sudo window. */
    sudo: `${ADMIN}/auth/sudo`,
    /** replaces the caller's recovery codes; requires sudo and shows them once. */
    recoveryCodes: `${ADMIN}/auth/mfa/recovery-codes`,
  },
  dashboard: {
    /** aggregate BFF-lite dashboard summary endpoint. */
    summary: `${ADMIN}/dashboard/summary`,
  },
  analytics: {
    /** fixed, permission-gated analytics series. */
    userGrowth: `${ADMIN}/analytics/user-growth`,
    activeUsers: `${ADMIN}/analytics/active-users`,
    registrations: `${ADMIN}/analytics/registrations`,
    userStatus: `${ADMIN}/analytics/user-status`,
    universities: `${ADMIN}/analytics/universities`,
    workStatus: `${ADMIN}/analytics/work-status`,
    xpDistribution: `${ADMIN}/analytics/xp-distribution`,
    languages: `${ADMIN}/analytics/languages`,
    platforms: `${ADMIN}/analytics/platforms`,
    /** audited CSV export for one analytics series. */
    export: `${ADMIN}/analytics/export`,
  },
  auditLogs: {
    /** newest-first, scope-aware audit trail. */
    list: `${ADMIN}/audit-logs`,
    detail: (auditLogId: string) => `${ADMIN}/audit-logs/${encodeURIComponent(auditLogId)}`,
    /** Super Admin-only, audited CSV export. */
    export: `${ADMIN}/audit-logs/export`,
  },
  roles: {
    /** role metadata and active admin counts for the roles list. */
    list: `${ADMIN}/roles`,
    /** one role and its effective permission codes. */
    detail: (roleId: string) => `${ADMIN}/roles/${encodeURIComponent(roleId)}`,
    /** enum-backed permission catalogue grouped by resource. */
    permissions: `${ADMIN}/permissions`,
    /** audited whole-set permission replacement. */
    updatePermissions: (roleId: string) =>
      `${ADMIN}/roles/${encodeURIComponent(roleId)}/permissions`,
  },
  admins: {
    /** paginated staff directory, including active and revoked profiles. */
    list: `${ADMIN}/admins`,
    /** audited promotion of an existing, email-verified user. */
    promote: `${ADMIN}/admins`,
    /** audited high-tier role replacement. */
    changeRole: (adminId: string) => `${ADMIN}/admins/${encodeURIComponent(adminId)}/role`,
    /** audited admin-access revocation. */
    deactivate: (adminId: string) => `${ADMIN}/admins/${encodeURIComponent(adminId)}/deactivate`,
    /** audited MFA reset and forced re-enrolment. */
    resetMfa: (adminId: string) => `${ADMIN}/admins/${encodeURIComponent(adminId)}/reset-mfa`,
  },
  users: {
    /** filterable, sortable and paginated user summary list. */
    list: `${ADMIN}/users`,
    /** audited, permission-gated CSV export of the filtered user directory. */
    export: `${ADMIN}/users/export`,
    /** read-only profile and account detail for the user detail shell. */
    detail: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}`,
    /** read-only cross-domain activity counters for one user. */
    activity: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/activity`,
    /** active, non-revoked sessions for one user. */
    sessions: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/sessions`,
    /** newest-first login/security history for one user. */
    loginHistory: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/login-history`,
    /** level, source breakdown, paginated ledger and badges for one user. */
    xp: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/xp`,
    /** contract consumed by the  enforcement dialogs. */
    ban: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/ban`,
    /** contract consumed by the  enforcement dialogs. */
    unban: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/unban`,
    /** contract consumed by the  enforcement dialogs. */
    suspend: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/suspend`,
    /** contract consumed by the  recovery dialogs. */
    verifyEmail: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/verify-email`,
    /** contract consumed by the  recovery dialogs. */
    resetPassword: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/reset-password`,
    /** contract consumed by the  recovery dialogs. */
    forceLogout: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/force-logout`,
    /** contract consumed by the  lifecycle dialogs. */
    delete: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}`,
    /** contract consumed by the  lifecycle dialogs. */
    restore: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/restore`,
    /** contract consumed by the  XP adjustment dialog. */
    xpAdjustment: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/xp`,
    /** read contract consumed by the  per-user enforcement timeline. */
    sanctions: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/sanctions`,
    /** warning contract consumed by the  warning dialog. */
    warnings: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/warnings`,
    /** staff-only notes read/create contract consumed by  */
    notes: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/notes`,
    /** bounded, audited bulk actions over selected users. */
    bulk: {
      ban: `${ADMIN}/users/bulk/ban`,
      notify: `${ADMIN}/users/bulk/notify`,
      badges: `${ADMIN}/users/bulk/badges`,
    },
  },
  sanctions: {
    /** enforcement list consumed by  */
    list: `${ADMIN}/sanctions`,
    /** lift contract consumed by the  enforcement timeline. */
    lift: (sanctionId: string) => `${ADMIN}/sanctions/${encodeURIComponent(sanctionId)}/lift`,
  },
  system: {
    /** Spring Boot Actuator & system health status endpoint. */
    health: `${ADMIN}/system/health`,
  },
  badges: {
    /** permission-gated catalogue projection for the bulk badge picker. */
    list: `${ADMIN}/badges`,
  },
  notifications: {
    /** Existing admin template catalogue used to suggest valid bulk-notification keys. */
    templates: `${ADMIN}/notifications/templates`,
  },
} as const;

/**
 * Builds a query string, dropping empties.
 *
 * `undefined`, `null` and `""` are omitted rather than sent: `?status=` reaches the backend
 * as an empty filter, not an absent one, and the Specification would then filter on a blank
 * value and return nothing.
 *
 * Arrays repeat the key (`?status=ACTIVE&status=PENDING`), which is what Spring binds to a
 * `List` parameter.
 */
export function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null || item === "") continue;
        search.append(key, String(item));
      }
      continue;
    }
    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}
