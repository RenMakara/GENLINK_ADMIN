// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserTableRow } from "./types";
import { BulkActionBar } from "./bulk-action-bar";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  clear: vi.fn(),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    has: (permission: string) =>
      ["user:ban", "notification:send", "badge:assign", "notification:template:manage"].includes(permission),
  }),
}));

vi.mock("@/services/bulk-actions", async () => {
  const actual = await vi.importActual<typeof import("@/services/bulk-actions")>("@/services/bulk-actions");
  return {
    ...actual,
    useBulkActions: () => ({ execute: mocks.execute, pending: false }),
    useAdminBadges: () => ({ data: [{ badgeId: "badge-1", nameEn: "Helpful" }], isLoading: false, isError: false, refetch: vi.fn() }),
    useAdminNotificationTemplates: () => ({
      data: [{ id: "template-1", templateKey: "ADMIN_ACCOUNT_REVIEW", titleEn: "Account review", messageEn: "Please review" }],
      isLoading: false,
      isError: false,
    }),
  };
});

const USERS: AdminUserTableRow[] = [
  {
    userId: "user-1",
    fullName: "Morm Rotana",
    username: "morm",
    email: "morm@example.com",
    avatarUrl: null,
    emailVerified: true,
    accountStatus: "ACTIVE",
    adminRoleName: null,
    universityName: null,
    workStatus: null,
    level: 1,
    totalXp: 100,
    createdAt: "2026-09-01T00:00:00Z",
    lastActiveAt: null,
  },
  {
    ...({} as AdminUserTableRow),
    userId: "user-2",
    fullName: "Dara Sok",
    email: "dara@example.com",
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("BulkActionBar (ADM-098)", () => {
  it("shows all four actions and requires the high-tier bulk-ban phrase", async () => {
    render(
      <BulkActionBar selectedUserIds={USERS.map((user) => user.userId)} selectedUsers={USERS} onClearSelection={mocks.clear} />,
    );

    expect(screen.getByText("2 users selected")).toBeDefined();
    expect(screen.getByRole("button", { name: "Ban" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Notify" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Assign badge" })).toBeDefined();
    expect((screen.getByRole("button", { name: /Export/ }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Ban" }));
    expect((screen.getByRole("button", { name: "Ban selected users" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Repeated abuse of the community rules" },
    });
    fireEvent.change(screen.getByLabelText(/Type the confirmation phrase/), {
      target: { value: "BAN 2 USERS" },
    });
    expect((screen.getByRole("button", { name: "Ban selected users" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("renders per-user partial failures with readable reasons", async () => {
    mocks.execute.mockResolvedValueOnce({
      batchId: "batch-1",
      batchIds: ["batch-1"],
      requested: 2,
      succeeded: 1,
      failed: [{ id: "user-2", errorCode: "USER_ALREADY_BANNED" }],
    });

    render(
      <BulkActionBar selectedUserIds={USERS.map((user) => user.userId)} selectedUsers={USERS} onClearSelection={mocks.clear} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ban" }));
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Repeated abuse of the community rules" },
    });
    fireEvent.change(screen.getByLabelText(/Type the confirmation phrase/), {
      target: { value: "BAN 2 USERS" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Ban selected users" }));

    await waitFor(() => expect(screen.getByText("1 of 2 succeeded")).toBeDefined());
    expect(screen.getByText("Dara Sok")).toBeDefined();
    fireEvent.click(screen.getByText("Show failure details (1)"));
    expect(screen.getByText("User is already banned.")).toBeDefined();
    expect(mocks.clear).toHaveBeenCalledOnce();
  });
});
