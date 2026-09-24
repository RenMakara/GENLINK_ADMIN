// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserSanction } from "./types";
import { UserSanctionLiftDialog } from "./user-sanction-lift-dialog";

function makeSanction(overrides: Partial<AdminUserSanction> = {}): AdminUserSanction {
  return {
    sanctionId: "sanction-1",
    userId: "user-1",
    userFullName: "Dara Sok",
    type: "SUSPENSION",
    severity: null,
    reason: "Temporary access pause for review",
    messageEn: null,
    messageKm: null,
    previousStatus: "ACTIVE",
    startsAt: "2026-09-24T01:00:00Z",
    expiresAt: "2026-10-01T01:00:00Z",
    acknowledgedAt: null,
    liftedAt: null,
    liftReason: null,
    issuedByAdminId: "admin-1",
    issuedByAdminName: "Sok Dara",
    liftedByAdminId: null,
    liftedByAdminName: null,
    active: true,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("UserSanctionLiftDialog (ADM-095)", () => {
  it("requires a reason and submits the sanction id to the lift contract", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserSanctionLiftDialog
        sanction={makeSanction()}
        pending={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Lift sanction" }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    expect(screen.getByText(/restore the account status captured before it/i)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Review completed; suspension is no longer required" },
    });
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        "sanction-1",
        "Review completed; suspension is no longer required",
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("explains that lifting a warning does not claim delivery", () => {
    render(
      <UserSanctionLiftDialog
        sanction={makeSanction({ type: "WARNING" })}
        pending={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(/does not imply that a user notification was delivered/i)).toBeDefined();
  });
});
