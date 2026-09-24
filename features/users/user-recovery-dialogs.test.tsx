// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserRecoveryDialogs } from "./user-recovery-dialogs";

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
    emailVerified: false,
    authProvider: "LOCAL",
    googleLinked: false,
    accountStatus: "PENDING",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
    tokenVersion: 1,
    mobileRole: "USER",
    totalXp: 0,
    level: 1,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("UserRecoveryDialogs (ADM-092)", () => {
  it("submits verify-email as a low-tier confirmation without a reason", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserRecoveryDialogs
        user={makeUser()}
        action="verify-email"
        pendingAction={null}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect((screen.getByRole("button", { name: "Verify email" }) as HTMLButtonElement).disabled).toBe(
      false,
    );
    fireEvent.click(screen.getByRole("button", { name: "Verify email" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("verify-email", "");
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("explains that reset sends an email and never exposes a password", () => {
    render(
      <UserRecoveryDialogs
        user={makeUser()}
        action="reset-password"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText(/password-reset email/i)).toBeDefined();
    expect(screen.getByText(/will not see or set the user's password/i)).toBeDefined();
    expect(
      (screen.getByRole("button", { name: "Send reset email" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("requires a medium-tier reason and warns that force logout signs out every device", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <UserRecoveryDialogs
        user={makeUser()}
        action="force-logout"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/Every device will be signed out/i)).toBeDefined();
    expect((screen.getByRole("button", { name: "Force logout" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Security review requires all sessions to be revoked" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Force logout" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        "force-logout",
        "Security review requires all sessions to be revoked",
      );
    });
  });

  it("does not render a verification dialog for an already verified account", () => {
    const { container } = render(
      <UserRecoveryDialogs
        user={makeUser({ emailVerified: true })}
        action="verify-email"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
