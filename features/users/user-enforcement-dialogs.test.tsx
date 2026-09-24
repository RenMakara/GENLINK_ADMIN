// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";

import type { AdminUserDetail } from "./types";
import { UserEnforcementDialogs } from "./user-enforcement-dialogs";

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

describe("UserEnforcementDialogs (ADM-091)", () => {
  it("requires a medium-tier reason and submits the ban action", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserEnforcementDialogs
        user={makeUser()}
        action="ban"
        pendingAction={null}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect((screen.getByRole("button", { name: "Ban user" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Repeated abuse of the community rules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("ban", "Repeated abuse of the community rules");
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("submits the selected fixed suspension duration", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <UserEnforcementDialogs
        user={makeUser()}
        action="suspend"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText("Suspension duration"), {
      target: { value: "168" },
    });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Temporary access pause for review" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Suspend user" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith(
        "suspend",
        "Temporary access pause for review",
        168,
      );
    });
  });

  it("surfaces USER_ALREADY_BANNED with a clear safe message", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new ApiError({ status: 400, rawCode: "USER_ALREADY_BANNED" }));

    render(
      <UserEnforcementDialogs
        user={makeUser()}
        action="ban"
        pendingAction={null}
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Repeated abuse of the community rules" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ban user" }));

    expect(
      await screen.findByText("This user is already banned. Refresh the record before trying again."),
    ).toBeDefined();
    expect(screen.queryByText("USER_ALREADY_BANNED")).toBeNull();
  });
});
