// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserXpAdjustmentDialogs } from "./user-xp-adjustment-dialogs";

function makeUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    userId: "user-1",
    fullName: "Dara Sok",
    username: "dara.sok",
    avatarUrl: null,
    bio: null,
    dateOfBirth: null,
    gender: null,
    phoneNumber: null,
    location: null,
    universityName: null,
    workStatus: null,
    preferredLanguage: "KHMER",
    coverPreset: 0,
    interests: [],
    socialLinks: [],
    portfolioCount: 0,
    email: "dara@example.com",
    emailVerified: true,
    authProvider: "LOCAL",
    googleLinked: false,
    accountStatus: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
    tokenVersion: 1,
    mobileRole: "USER",
    totalXp: 90,
    level: 1,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("UserXpAdjustmentDialogs (ADM-094)", () => {
  it("previews the resulting level and submits a grant amount with its reason", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserXpAdjustmentDialogs
        user={makeUser()}
        action="grant-xp"
        pendingAction={null}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("190")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Verified campaign contribution" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Grant XP" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("grant-xp", 100, "Verified campaign contribution");
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("requires a negative revoke amount and floors the preview at zero", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <UserXpAdjustmentDialogs
        user={makeUser({ totalXp: 150, level: 2 })}
        action="revoke-xp"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const amount = screen.getByLabelText("XP amount") as HTMLInputElement;
    fireEvent.change(amount, { target: { value: "10" } });
    expect(screen.getByText("Remove amount must be negative.")).toBeDefined();
    expect((screen.getByRole("button", { name: "Remove XP" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.change(amount, { target: { value: "-200" } });
    expect(screen.getByText("0")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Corrected an accidental XP award" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove XP" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("revoke-xp", -200, "Corrected an accidental XP award");
    });
  });

  it("keeps confirmation disabled for empty, zero, and fractional amounts", () => {
    render(
      <UserXpAdjustmentDialogs
        user={makeUser()}
        action="grant-xp"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    const amount = screen.getByLabelText("XP amount") as HTMLInputElement;
    const confirm = screen.getByRole("button", { name: "Grant XP" }) as HTMLButtonElement;

    fireEvent.change(amount, { target: { value: "0" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(amount, { target: { value: "1.5" } });
    expect(confirm.disabled).toBe(true);
    fireEvent.change(amount, { target: { value: "" } });
    expect(confirm.disabled).toBe(true);
  });
});
