// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserLifecycleDialogs } from "./user-lifecycle-dialogs";

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
    totalXp: 0,
    level: 1,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("UserLifecycleDialogs (ADM-093)", () => {
  it("requires the exact username and reason before deleting", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserLifecycleDialogs
        user={makeUser()}
        action="delete"
        pendingAction={null}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/restored for 30 days/i)).toBeDefined();
    expect(screen.getByText(/anonymisation is irreversible/i)).toBeDefined();
    const deleteButton = screen.getByRole("button", { name: "Delete account" }) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Confirmed duplicate account after review" },
    });
    fireEvent.change(screen.getByLabelText(/Type the username/i), {
      target: { value: "dara.sok" },
    });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("delete", "Confirmed duplicate account after review");
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("restores a soft-deleted account with the same high-tier gate", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <UserLifecycleDialogs
        user={makeUser({ accountStatus: "DELETED", deletedAt: new Date().toISOString() })}
        action="restore"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText(/return to the status captured before deletion/i)).toBeDefined();
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Account owner completed the recovery review" },
    });
    fireEvent.change(screen.getByLabelText(/Type the username/i), {
      target: { value: "dara.sok" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Restore account" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        "restore",
        "Account owner completed the recovery review",
      );
    });
  });

  it("does not offer restore after the anonymisation boundary", () => {
    const { container } = render(
      <UserLifecycleDialogs
        user={makeUser({
          accountStatus: "DELETED",
          deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
        })}
        action="restore"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
