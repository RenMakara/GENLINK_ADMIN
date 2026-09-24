// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserWarningDialog } from "./user-warning-dialog";

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

describe("UserWarningDialog (ADM-096)", () => {
  it("requires both bilingual messages and preserves the delivery gap copy", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();

    render(
      <UserWarningDialog
        user={makeUser()}
        open
        pending={false}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByText(
        "Recorded. In-app delivery arrives in a later release. Do not assume the user was notified.",
      ),
    ).toBeDefined();
    expect((screen.getByRole("button", { name: "Record warning" }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    const khmer = screen.getByLabelText("Message in Khmer") as HTMLTextAreaElement;
    expect(khmer.lang).toBe("km");
    expect(khmer.className).toContain("font-khmer");

    fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Repeated violation after the previous review" },
    });
    fireEvent.change(screen.getByLabelText("Message in English"), {
      target: { value: "Please review the community guidelines before posting again." },
    });
    fireEvent.change(khmer, { target: { value: "សូមពិនិត្យគោលការណ៍សហគមន៍។" } });
    fireEvent.click(screen.getByRole("button", { name: "Record warning" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        severity: "HIGH",
        reason: "Repeated violation after the previous review",
        messageEn: "Please review the community guidelines before posting again.",
        messageKm: "សូមពិនិត្យគោលការណ៍សហគមន៍។",
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("keeps confirmation disabled when either language is missing", () => {
    render(
      <UserWarningDialog
        user={makeUser()}
        open
        pending={false}
        onOpenChange={vi.fn()}
        onConfirm={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.change(screen.getByLabelText("Message in English"), {
      target: { value: "English warning text" },
    });

    expect((screen.getByRole("button", { name: "Record warning" }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
