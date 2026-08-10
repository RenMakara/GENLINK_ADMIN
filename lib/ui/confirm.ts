/**
 * The rules behind a sensitive-action confirmation (ADM-040, SSOT §10.7).
 *
 * <p>Pure and DOM-free, so the part that decides whether a destructive action may proceed is
 * unit-testable without rendering anything. The dialog in `components/common/confirm-dialog.tsx`
 * is a shell around this; the shell can be eyeballed, but "does an eight-character reason block
 * a ban?" is a question that deserves an assertion, not a squint.
 */

/**
 * SSOT §10.7's three tiers.
 *
 * <ul>
 *   <li><strong>low</strong> — add note, warn, verify email. A plain "are you sure".</li>
 *   <li><strong>medium</strong> — ban, suspend, force logout, XP change, delete content. Adds a
 *       mandatory reason, which lands in the audit log.</li>
 *   <li><strong>high</strong> — delete user, bulk ban, CSV export, role change, finance
 *       adjustment. Reason <em>and</em> typing the target's name, so a destructive click on an
 *       unattended laptop cannot land by reflex.</li>
 * </ul>
 */
export type ConfirmTier = "low" | "medium" | "high";

/** SSOT §10.7: the mandatory reason must be at least this many characters, trimmed. */
export const MIN_REASON_LENGTH = 10;

export interface ConfirmGateInput {
  tier: ConfirmTier;
  /** What the operator typed as the reason. */
  reason: string;
  /** What they typed into the "type the name to confirm" field. */
  confirmationInput: string;
  /** The exact string they must reproduce — the target's username or email. */
  confirmationTarget: string;
}

export interface ConfirmGateState {
  reasonRequired: boolean;
  confirmationRequired: boolean;
  /** A message when the reason is required and not yet satisfactory, else null. */
  reasonError: string | null;
  /** A message when the typed confirmation is required and does not match, else null. */
  confirmationError: string | null;
  /** True only when every requirement for the tier is met. Drives the confirm button. */
  canConfirm: boolean;
}

/**
 * Whether the confirm button may be enabled, and why not when it may not.
 *
 * <h2>Two decisions kept deliberately strict</h2>
 *
 * <p>The reason is compared <em>trimmed</em>: ten spaces is not a reason, and an audit log full
 * of whitespace is worse than useless because it looks filled in. The typed confirmation is
 * compared <em>exactly</em> — not trimmed, not case-folded. The whole point of the high tier is
 * that the operator's fingers had to reproduce the target precisely; loosening the match to be
 * "friendly" is loosening the one control that stands between a tired admin and the wrong
 * account. If a target legitimately has trailing spaces, the caller should trim it before
 * passing it in, not have this function guess.
 */
export function confirmGate(input: ConfirmGateInput): ConfirmGateState {
  const reasonRequired = input.tier !== "low";
  const confirmationRequired = input.tier === "high";

  let reasonError: string | null = null;
  if (reasonRequired) {
    const trimmed = input.reason.trim();
    if (trimmed.length === 0) {
      reasonError = "A reason is required.";
    } else if (trimmed.length < MIN_REASON_LENGTH) {
      reasonError = `Please give a little more detail (at least ${MIN_REASON_LENGTH} characters).`;
    }
  }

  let confirmationError: string | null = null;
  if (confirmationRequired && input.confirmationInput !== input.confirmationTarget) {
    confirmationError = "This does not match. Type it exactly to confirm.";
  }

  const canConfirm = reasonError === null && confirmationError === null;

  return { reasonRequired, confirmationRequired, reasonError, confirmationError, canConfirm };
}
