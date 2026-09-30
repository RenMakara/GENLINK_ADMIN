/** Permission codes control UI visibility; the server must enforce every action. */

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

/** Union of recognized permission codes. */
export type Permission = (typeof PERMISSIONS)[number];

/** Keeps only permission codes recognized by this build. */
export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

/** Keeps only the codes this build understands. See {@link isPermission}. */
export function toPermissions(values: readonly string[]): Permission[] {
  return values.filter(isPermission);
}
