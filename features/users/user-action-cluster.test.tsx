// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDetail } from "./types";
import { UserActionCluster, getUserActionClusterModel } from "./user-action-cluster";

const permissionState = vi.hoisted(() => ({ values: [] as string[] }));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    permissions: permissionState.values,
    ready: true,
    has: (permission: string) => permissionState.values.includes(permission),
    hasAll: (...required: string[]) => required.every((permission) => permissionState.values.includes(permission)),
    hasAny: (...required: string[]) => required.some((permission) => permissionState.values.includes(permission)),
  }),
}));

function makeUser(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    userId: "397939ea-0e71-4bb5-9b4a-3d2707296630",
    fullName: "Dara Sok",
    username: "dara.sok",
    avatarUrl: null,
    bio: null,
    dateOfBirth: null,
    gender: null,
    phoneNumber: null,
    location: "Phnom Penh",
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
    accountStatus: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
    tokenVersion: 1,
    mobileRole: "USER",
    totalXp: 240,
    level: 3,
    adminRoleName: null,
    currentSanction: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  permissionState.values = [];
});

describe("UserActionCluster (ADM-090)", () => {
  it("shows Unban instead of Ban for a banned user", () => {
    permissionState.values = ["user:ban", "user:unban", "user:suspend"];

    render(<UserActionCluster user={makeUser({ accountStatus: "BANNED" })} />);

    expect(screen.getByRole("button", { name: "Unban" })).toBeDefined();
    expect(screen.queryByRole("button", { name: /^Ban$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Suspend$/ })).toBeNull();
  });

  it("explains that an anonymised account cannot be restored", () => {
    const deletedAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    permissionState.values = ["user:delete"];

    render(
      <UserActionCluster
        user={makeUser({ accountStatus: "DELETED", deletedAt })}
      />,
    );

    expect(screen.getByText("Anonymised — cannot be restored", { exact: true })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Restore account" })).toBeNull();
    expect(screen.queryByRole("button", { name: "More user actions" })).toBeNull();
  });

  it("shows SUPPORT recovery actions without enforcement controls", async () => {
    permissionState.values = [
      "user:verify_email",
      "user:reset_password",
      "user:force_logout",
    ];

    render(<UserActionCluster user={makeUser()} />);

    expect(screen.queryByRole("button", { name: /^Ban$/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Suspend$/ })).toBeNull();

    fireEvent.pointerDown(screen.getByRole("button", { name: "More user actions" }), {
      button: 0,
    });
    expect(await screen.findByRole("menuitem", { name: "Verify email" })).toBeDefined();
    expect(await screen.findByRole("menuitem", { name: "Reset password" })).toBeDefined();
    expect(await screen.findByRole("menuitem", { name: "Force logout" })).toBeDefined();
  });

  it("keeps state and permission rules available as a pure model", () => {
    const model = getUserActionClusterModel(
      makeUser({ accountStatus: "DELETED", deletedAt: new Date().toISOString() }),
      ["user:delete"],
    );

    expect(model.primary).toEqual([]);
    expect(model.overflow).toEqual([
      { id: "restore", label: "Restore account", permission: "user:delete" },
    ]);
  });
});
