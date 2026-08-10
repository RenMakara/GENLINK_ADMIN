/**
 * Every admin permission, mirroring SSOT §5.3 (ADM-038).
 *
 * <h2>These are UX, never security</h2>
 *
 * <strong>Nothing in this file protects anything.</strong> A permission check in React decides
 * whether to render a button; it does not decide whether the action is allowed. The server
 * decides that, on every request, from the caller's own granted authorities — and a determined
 * visitor can edit the client's answer in their browser in about ten seconds.
 *
 * <p>The failure mode this warning exists for: someone gates a new destructive endpoint in
 * React, sees the button disappear for a `SUPPORT` user, and ships it with no `@PreAuthorize`
 * on the Spring side. It looks correct in every screenshot and is completely open. Every admin
 * endpoint must carry its own authorization (SSOT §5.6).
 *
 * <p>What this <em>is</em> for: not rendering controls that would answer 403. An admin who
 * cannot ban should not be shown a Ban button that fails when pressed.
 *
 * <h2>Kept in step with three other places</h2>
 *
 * The same forty codes appear in SSOT §5.3, in `Permission.java`, and in the migration that
 * seeds the role grants. They were verified identical when this file was written. A code here
 * that the backend does not know is not a compile error anywhere — it simply never matches, so
 * a feature silently disappears from the UI for everyone. `permissions.test.ts` pins the count
 * and the grouping so an accidental edit is visible.
 */

/** Grouped and ordered exactly as SSOT §5.3 lists them, so a diff against it is readable. */
export const PERMISSIONS = [
  // Overview
  "dashboard:view",
  "analytics:view",
  "analytics:export",

  // Users
  "user:read",
  "user:update",
  "user:export",
  "user:export:pii",
  "user:ban",
  "user:unban",
  "user:suspend",
  "user:verify_email",
  "user:reset_password",
  "user:force_logout",
  "user:delete",
  "user:warn",
  "user:note:write",

  // Gamification
  "xp:grant",
  "xp:revoke",
  "badge:assign",
  "gamification:manage",

  // Content
  "community:moderate",
  "forum:moderate",
  "story:moderate",
  "event:read",
  "event:manage",
  "opportunity:manage",
  "media:read",
  "media:delete",

  // Engagement and reports
  "notification:send",
  "notification:template:manage",
  "report:read",
  "report:resolve",

  // Finance
  "finance:read",
  "finance:ledger:read",

  // System
  "rbac:read",
  "rbac:manage",
  "audit:read",
  "localization:manage",
  "settings:read",
  "settings:manage",
] as const;

/**
 * The union every permission check is typed against.
 *
 * <p>Derived from the array rather than written twice, so the list and the type cannot
 * disagree. `usePermission("user:bann")` is a compile error (ADM-038 AC#1).
 */
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Narrows an arbitrary string from the API.
 *
 * <p>`/admin/auth/me` returns `string[]`, and TypeScript cannot know those are valid codes.
 * Rather than asserting, unknown codes are dropped: a backend that gained a permission this
 * build has never heard of should leave the UI unchanged, not crash it.
 */
export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

/** Keeps only the codes this build understands. See {@link isPermission}. */
export function toPermissions(values: readonly string[]): Permission[] {
  return values.filter(isPermission);
}
