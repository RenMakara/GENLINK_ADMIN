/**
 * Every admin endpoint, in one place.
 *
 * <p>Paths live here rather than inline at call sites so a route change is one edit, and so
 * the set of things the portal talks to is readable at a glance. Paths are relative to
 * `NEXT_PUBLIC_API_BASE_URL`; nothing here names a host (SSOT §1.7).
 *
 * <p>Most entries are deployed backend endpoints. A small number of explicitly labelled contract
 * routes are included when the frontend is intentionally working ahead of its backend task; the
 * label keeps those routes distinguishable from live APIs at the call site.
 */

const ADMIN = "/admin";

export const endpoints = {
  auth: {
    /** ADM-021: password step; issues an MFA challenge, not a session. */
    login: `${ADMIN}/auth/login`,
    /** ADM-022: begins enrolment; returns the secret and otpauth:// URI once. */
    enrolMfa: `${ADMIN}/auth/mfa/enrol`,
    /** ADM-022: confirms the first code and returns the recovery codes, once. */
    confirmMfa: `${ADMIN}/auth/mfa/confirm`,
    /** ADM-023: TOTP or recovery code; issues the real tokens. */
    verifyMfa: `${ADMIN}/auth/mfa/verify`,
    /** ADM-024: rotates the access token using the refresh cookie. */
    refresh: `${ADMIN}/auth/refresh`,
    logout: `${ADMIN}/auth/logout`,
    /** ADM-024: identity, role and the resolved permission list. */
    me: `${ADMIN}/auth/me`,
    /** ADM-025: opens the 5-minute sudo window (SSOT §10.7). */
    sudo: `${ADMIN}/auth/sudo`,
  },
  dashboard: {
    /** ADM-045: aggregate BFF-lite dashboard summary endpoint. */
    summary: `${ADMIN}/dashboard/summary`,
  },
  users: {
    /** ADM-059: filterable, sortable and paginated user summary list. */
    list: `${ADMIN}/users`,
    /** ADM-062: read-only profile and account detail for the user detail shell. */
    detail: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}`,
    /** ADM-065: read-only cross-domain activity counters for one user. */
    activity: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/activity`,
    /** ADM-063: active, non-revoked sessions for one user. */
    sessions: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/sessions`,
    /** ADM-064: newest-first login/security history for one user. */
    loginHistory: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/login-history`,
    /** ADM-063: level, source breakdown, paginated ledger and badges for one user. */
    xp: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/xp`,
    /** ADM-078 contract consumed by the ADM-091 enforcement dialogs. */
    ban: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/ban`,
    /** ADM-078 contract consumed by the ADM-091 enforcement dialogs. */
    unban: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/unban`,
    /** ADM-078 contract consumed by the ADM-091 enforcement dialogs. */
    suspend: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/suspend`,
    /** ADM-080 contract consumed by the ADM-092 recovery dialogs. */
    verifyEmail: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/verify-email`,
    /** ADM-080 contract consumed by the ADM-092 recovery dialogs. */
    resetPassword: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/reset-password`,
    /** ADM-080 contract consumed by the ADM-092 recovery dialogs. */
    forceLogout: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/force-logout`,
    /** ADM-081 contract consumed by the ADM-093 lifecycle dialogs. */
    delete: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}`,
    /** ADM-081 contract consumed by the ADM-093 lifecycle dialogs. */
    restore: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/restore`,
    /** ADM-082 contract consumed by the ADM-094 XP adjustment dialog. */
    xpAdjustment: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/xp`,
    /** ADM-084 read contract consumed by the ADM-095 per-user enforcement timeline. */
    sanctions: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/sanctions`,
    /** ADM-083 warning contract consumed by the ADM-096 warning dialog. */
    warnings: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/warnings`,
    /** ADM-083 staff-only notes read/create contract consumed by ADM-096. */
    notes: (userId: string) => `${ADMIN}/users/${encodeURIComponent(userId)}/notes`,
  },
  sanctions: {
    /** ADM-084 global enforcement list consumed by ADM-097. */
    list: `${ADMIN}/sanctions`,
    /** ADM-084 lift contract consumed by the ADM-095 enforcement timeline. */
    lift: (sanctionId: string) => `${ADMIN}/sanctions/${encodeURIComponent(sanctionId)}/lift`,
  },
  system: {
    /** ADM-047: Spring Boot Actuator & system health status endpoint. */
    health: `${ADMIN}/system/health`,
  },
} as const;

/**
 * Builds a query string, dropping empties.
 *
 * <p>`undefined`, `null` and `""` are omitted rather than sent: `?status=` reaches the backend
 * as an empty filter, not an absent one, and the Specification would then filter on a blank
 * value and return nothing.
 *
 * <p>Arrays repeat the key (`?status=ACTIVE&status=PENDING`), which is what Spring binds to a
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
