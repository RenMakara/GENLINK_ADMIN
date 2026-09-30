import { describe, expect, it } from "vitest";

import { confirmGate, MIN_REASON_LENGTH, type ConfirmTier } from "@/lib/ui/confirm";

/** Tests confirmation rules independently of dialog styling. */

const target = "sok.dara@genlink.kh";

/** A convenience for the common shape — most cases only vary one field. */
function gate(over: Partial<Parameters<typeof confirmGate>[0]> & { tier: ConfirmTier }) {
  return confirmGate({
    reason: "",
    confirmationInput: "",
    confirmationTarget: target,
    ...over,
  });
}

describe("low tier", () => {
  /** A plain confirm: nothing to fill in, so the button is live immediately. */
  it("needs neither a reason nor a typed confirmation", () => {
    const state = gate({ tier: "low" });
    expect(state.reasonRequired).toBe(false);
    expect(state.confirmationRequired).toBe(false);
    expect(state.canConfirm).toBe(true);
  });

  it("ignores a reason even if one is supplied", () => {
    expect(gate({ tier: "low", reason: "x" }).canConfirm).toBe(true);
  });
});

describe("medium tier", () => {
  it("requires a reason", () => {
    const state = gate({ tier: "medium" });
    expect(state.reasonRequired).toBe(true);
    expect(state.reasonError).not.toBeNull();
    expect(state.canConfirm).toBe(false);
  });

  it("does not require a typed confirmation", () => {
    expect(gate({ tier: "medium" }).confirmationRequired).toBe(false);
  });

  /** SSOT §10.7 sets the floor at ten characters. Nine is one short and must not pass. */
  it(`rejects a reason under ${MIN_REASON_LENGTH} characters`, () => {
    expect(gate({ tier: "medium", reason: "too short" }).canConfirm).toBe(false); // 9 chars
  });

  it(`accepts a reason of exactly ${MIN_REASON_LENGTH} characters`, () => {
    expect(gate({ tier: "medium", reason: "0123456789" }).canConfirm).toBe(true);
  });

  /**
   * Ten spaces is ten characters and no reason at all. Trimming before the length check is what
   * keeps the audit log honest — the whole reason for demanding one is that someone can read it
   * later.
   */
  it("does not accept whitespace as a reason", () => {
    const state = gate({ tier: "medium", reason: "          " });
    expect(state.canConfirm).toBe(false);
    expect(state.reasonError).not.toBeNull();
  });

  it("distinguishes an empty reason from a too-short one in the message", () => {
    expect(gate({ tier: "medium", reason: "" }).reasonError).toMatch(/required/i);
    expect(gate({ tier: "medium", reason: "short" }).reasonError).toMatch(/more detail/i);
  });
});

describe("high tier", () => {
  const goodReason = "Confirmed duplicate account after review";

  it("requires both a reason and the typed target", () => {
    const state = gate({ tier: "high" });
    expect(state.reasonRequired).toBe(true);
    expect(state.confirmationRequired).toBe(true);
    expect(state.canConfirm).toBe(false);
  });

  it("stays blocked when only the reason is given", () => {
    expect(gate({ tier: "high", reason: goodReason }).canConfirm).toBe(false);
  });

  it("stays blocked when only the confirmation is typed", () => {
    expect(gate({ tier: "high", confirmationInput: target }).canConfirm).toBe(false);
  });

  it("passes when the reason is valid and the target is reproduced exactly", () => {
    const state = gate({ tier: "high", reason: goodReason, confirmationInput: target });
    expect(state.canConfirm).toBe(true);
    expect(state.confirmationError).toBeNull();
  });

  /**
   * The match is exact by design (SSOT §10.7). These are the "friendly" loosenings that would
   * defeat the control — each one is a near miss a tired operator might produce, and each must
   * be refused.
   */
  it.each([
    ["trailing space", `${target} `],
    ["leading space", ` ${target}`],
    ["wrong case", target.toUpperCase()],
    ["truncated", target.slice(0, -1)],
    ["a different address", "someone.else@genlink.kh"],
  ])("refuses a %s in the confirmation", (_label, typed) => {
    const state = gate({ tier: "high", reason: goodReason, confirmationInput: typed });
    expect(state.canConfirm).toBe(false);
    expect(state.confirmationError).not.toBeNull();
  });
});
