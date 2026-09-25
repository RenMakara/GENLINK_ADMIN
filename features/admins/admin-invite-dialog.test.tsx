// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminPermissionGroup, AdminRoleDetail, AdminRoleSummary } from "@/types/admin-role";
import type { AdminUserTableRow } from "@/types/admin-user";

import { AdminInviteDialog } from "./admin-invite-dialog";

const services = vi.hoisted(() => ({
  useUserSearch: vi.fn(),
  useAdminRole: vi.fn(),
  useAdminPermissionGroups: vi.fn(),
}));

vi.mock("@/services/users", () => ({
  useUserSearch: services.useUserSearch,
}));

vi.mock("@/services/roles", () => ({
  useAdminRole: services.useAdminRole,
  useAdminPermissionGroups: services.useAdminPermissionGroups,
}));

const ROLES: AdminRoleSummary[] = [
  {
    roleId: "role-super",
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Owner role",
    isSystem: true,
    adminCount: 1,
  },
  {
    roleId: "role-support",
    code: "SUPPORT",
    name: "Support",
    description: "Unblocks users; cannot punish them.",
    isSystem: true,
    adminCount: 1,
  },
];

const ELIGIBLE: AdminUserTableRow = {
  userId: "user-eligible",
  fullName: "Nika Vann",
  username: "nikavann",
  email: "nika@genlink.kh",
  avatarUrl: null,
  emailVerified: true,
  accountStatus: "ACTIVE",
  adminRoleName: null,
  universityName: null,
  workStatus: null,
  level: 4,
  totalXp: 180,
  createdAt: "2026-06-10T02:30:00.000Z",
  lastActiveAt: null,
};

const UNVERIFIED: AdminUserTableRow = {
  ...ELIGIBLE,
  userId: "user-unverified",
  fullName: "Pending User",
  email: "pending@genlink.kh",
  emailVerified: false,
};

const EXISTING_ADMIN: AdminUserTableRow = {
  ...ELIGIBLE,
  userId: "user-admin",
  fullName: "Malis Chan",
  email: "malis@genlink.kh",
  adminRoleName: "Support",
};

const ROLE_DETAIL: AdminRoleDetail = {
  ...ROLES[1],
  permissions: ["user:read", "dashboard:view"],
};

const GROUPS: AdminPermissionGroup[] = [
  {
    resource: "dashboard",
    permissions: [
      {
        code: "dashboard:view",
        resource: "dashboard",
        action: "view",
        description: "View the admin dashboard",
      },
    ],
  },
  {
    resource: "user",
    permissions: [
      {
        code: "user:read",
        resource: "user",
        action: "read",
        description: "View user records",
      },
    ],
  },
];

function renderInvite(overrides: Partial<React.ComponentProps<typeof AdminInviteDialog>> = {}) {
  const onPromote = vi.fn().mockResolvedValue(undefined);
  services.useUserSearch.mockReturnValue({
    data: { content: [ELIGIBLE, UNVERIFIED, EXISTING_ADMIN] },
    isLoading: false,
    isError: false,
    error: null,
  });
  services.useAdminRole.mockReturnValue({
    data: ROLE_DETAIL,
    isLoading: false,
    isError: false,
    error: null,
  });
  services.useAdminPermissionGroups.mockReturnValue({
    data: GROUPS,
    isLoading: false,
    isError: false,
    error: null,
  });

  render(
    <AdminInviteDialog
      open
      onOpenChange={vi.fn()}
      roles={ROLES}
      currentRoleCode="SUPPORT"
      canReadUsers
      onPromote={onPromote}
      {...overrides}
    />,
  );

  return { onPromote };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("AdminInviteDialog (ADM-110)", () => {
  it("allows only verified non-admin users and hides SUPER_ADMIN from non-super admins", () => {
    vi.useFakeTimers();
    renderInvite();

    fireEvent.change(screen.getByLabelText("Search by email"), {
      target: { value: "nika" },
    });
    act(() => vi.advanceTimersByTime(300));

    expect(screen.getByRole("option", { name: /nika@genlink\.kh/ })).toBeDefined();
    expect(screen.getByRole("option", { name: /pending@genlink\.kh/ })).toHaveProperty("disabled", true);
    expect(screen.getByRole("option", { name: /malis@genlink\.kh/ })).toHaveProperty("disabled", true);
    expect(screen.queryByRole("option", { name: /Super Admin/ })).toBeNull();
    expect(screen.getByText("SUPER_ADMIN is available only to an existing Super Admin.")).toBeDefined();
  });

  it("shows the role permission-group summary and submits the audited high-tier promotion", async () => {
    vi.useFakeTimers();
    const { onPromote } = renderInvite();

    fireEvent.change(screen.getByLabelText("Search by email"), {
      target: { value: "nika" },
    });
    act(() => vi.advanceTimersByTime(300));
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("option", { name: /nika@genlink\.kh/ }));
    fireEvent.change(screen.getByLabelText("Admin role"), {
      target: { value: "role-support" },
    });

    expect(screen.getByRole("region", { name: "Support permission summary" })).toBeDefined();
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("User")).toBeDefined();
    expect(screen.getByText(/fresh sudo verification is required/i)).toBeDefined();

    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Promote the verified support coordinator" },
    });
    fireEvent.change(screen.getByLabelText(/Type the email/), {
      target: { value: "nika@genlink.kh" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Promote to admin" }));

    await waitFor(() => expect(onPromote).toHaveBeenCalledWith({
      userId: "user-eligible",
      roleId: "role-support",
      reason: "Promote the verified support coordinator",
    }));
  });
});
