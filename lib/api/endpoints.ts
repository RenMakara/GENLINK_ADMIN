/**
 * Every admin endpoint, in one place.
 *
 * <p>Paths live here rather than inline at call sites so a route change is one edit, and so
 * the set of things the portal talks to is readable at a glance. Paths are relative to
 * `NEXT_PUBLIC_API_BASE_URL`; nothing here names a host (SSOT §1.7).
 *
 * <p>Only the endpoints that exist on the backend today are listed. The rest arrive with
 * their tasks — an exhaustive map of unbuilt routes would be indistinguishable from a working
 * one at the call site.
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
