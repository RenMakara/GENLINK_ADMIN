/**
 * The rules behind a sensitive-action confirmation.
 */
export type ConfirmTier = "low" | "medium" | "high";

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
