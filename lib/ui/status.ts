/**
 * How each account status is drawn (ADM-040, SSOT §11.2).
 *
 * <p>Pure and DOM-free so the one rule that actually matters can be tested in node: **every
 * status carries a word, not just a colour**. Roughly 1 in 12 men has a colour-vision
 * deficiency, and the person banning accounts may be one of them (SSOT §11.2) — so a green pill
 * and a red pill that read identically to them is not an acceptable UI. The label is the
 * load-bearing signal; the colour is a second, redundant one.
 */

/**
 * The five states, mirroring the backend `AccountStatus` enum exactly.
 *
 * <p>`PENDING` is registered-but-unverified, `DELETED` is soft-deleted. Kept in this order —
 * lifecycle, roughly — because it is the order a filter dropdown should list them in.
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

/**
 * Semantic mapping from SSOT §11.2: green = healthy, amber = temporary, red = terminal, and two
 * neutral tones for the states that are neither good nor bad.
 *
 * <p>Solid fills rather than the tinted badge variants, because a status badge has to stay
 * legible on any surface it lands on — a tint that is fine on a white card can wash out on a
 * muted table row, and only the solid pairs are the ones the contrast script verifies.
 */
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
 * <p>An unrecognised value gets a neutral pill labelled with the raw code rather than throwing:
 * a backend that grows a sixth status should make the badge say something honest, not take down
 * every page that renders a user row. The label is still a word, so AC#1 holds even here.
 */
export function statusPresentation(status: string): StatusPresentation {
  if (isUserStatus(status)) {
    return PRESENTATION[status];
  }
  return { label: status || "Unknown", className: "bg-muted text-muted-foreground" };
}
