/**
 * How each account status is drawn.
 */

export const USER_STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "BANNED", "DELETED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface StatusPresentation {
  /** The word shown in the badge. Never empty — this is the non-colour signal (AC#1). */
  label: string;
  /**
   * Utility classes for the pill, all built from tokens the contrast gate already checks
   * (`success`, `warning`, `destructive`, `secondary`, `muted`). No new colour enters the
   * palette, so `pnpm check:contrast` stays green without a new pair to register.
   */
  className: string;
}

const PRESENTATION: Record<UserStatus, StatusPresentation> = {
  ACTIVE: { label: "Active", className: "bg-success text-success-foreground" },
  PENDING: { label: "Pending", className: "bg-secondary text-secondary-foreground" },
  SUSPENDED: { label: "Suspended", className: "bg-warning text-warning-foreground" },
  BANNED: { label: "Banned", className: "bg-destructive text-destructive-foreground" },
  DELETED: { label: "Deleted", className: "bg-muted text-muted-foreground" },
};

/** Narrows an arbitrary string from the API to a known status. */
export function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}

/**
 * How to draw a status.
 *
 * An unrecognised value gets a neutral pill labelled with the raw code rather than throwing:
 * a backend that grows a sixth status should make the badge say something honest, not take down
 * every page that renders a user row. The label is still a word, so AC#1 holds even here.
 */
export function statusPresentation(status: string): StatusPresentation {
  if (isUserStatus(status)) {
    return PRESENTATION[status];
  }
  return { label: status || "Unknown", className: "bg-muted text-muted-foreground" };
}
