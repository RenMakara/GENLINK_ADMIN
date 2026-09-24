// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserNoteDialog } from "./user-note-dialog";

function makeUser(): AdminUserDetail {
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
  };
}

afterEach(() => cleanup());

describe("UserNoteDialog (ADM-096)", () => {
  it("states that notes are staff-only and submits a trimmed append-only note", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserNoteDialog
        user={makeUser()}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByText("Visible to staff only. The user will not see this note.")).toBeDefined();
    expect((screen.getByRole("button", { name: "Add note" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    fireEvent.change(screen.getByLabelText("Internal note"), {
      target: { value: "  Follow up with the account owner.  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add note" }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith("Follow up with the account owner."));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
