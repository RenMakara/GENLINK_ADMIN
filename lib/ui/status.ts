/** Status labels and colors; text carries the meaning for accessibility. */

/** Account statuses in display order, matching the backend enum. */
export const USER_STATUSES = ["ACTIVE", "PENDING", "SUSPENDED", "BANNED", "DELETED"] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

export interface StatusPresentation {
  /** The word shown in the badge. Never empty — this is the non-colour signal (AC#1). */
  label: string;
  /** Token-based classes used by status pills. */
  className: string;
}

/** Maps healthy, temporary, terminal, and neutral statuses to semantic colors. */
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

/** Returns a readable label and color for known or unknown status values. */
export function statusPresentation(status: string): StatusPresentation {
  if (isUserStatus(status)) {
    return PRESENTATION[status];
  }
  return { label: status || "Unknown", className: "bg-muted text-muted-foreground" };
}
