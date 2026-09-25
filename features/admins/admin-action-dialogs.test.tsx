// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { AdminRoleSummary } from "@/types/admin-role";
import type { AdminStaff } from "@/types/admin-staff";

import { AdminActionDialogs, adminActionErrorMessage } from "./admin-action-dialogs";

const ADMIN: AdminStaff = {
  adminId: "admin-2",
  userId: "user-2",
  fullName: "Malis Chan",
  username: "malischan",
  email: "malis@genlink.kh",
  roleId: "role-support",
  roleCode: "SUPPORT",
  roleName: "Support",
  active: true,
  totpEnabled: true,
  totpConfirmed: true,
  lastLoginAt: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  deletedAt: null,
};

const ROLES: AdminRoleSummary[] = [
  {
    roleId: "role-support",
    code: "SUPPORT",
    name: "Support",
    description: "Recovery role",
    isSystem: true,
    adminCount: 1,
  },
  {
    roleId: "role-admin",
    code: "ADMIN",
    name: "Admin",
    description: "General administration",
    isSystem: true,
    adminCount: 2,
  },
];

const baseProps = {
  admin: ADMIN,
  roles: ROLES,
  onOpenChange: vi.fn(),
  onChangeRole: vi.fn().mockResolvedValue(undefined),
  onDeactivate: vi.fn().mockResolvedValue(undefined),
  onResetMfa: vi.fn().mockResolvedValue(undefined),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminActionDialogs (ADM-111)", () => {
  it("states that role changes revoke active sessions before confirmation", () => {
    render(<AdminActionDialogs {...baseProps} action="change-role" />);

    expect(screen.getByText(/all active sessions will be revoked/i)).toBeDefined();
    expect(screen.getByLabelText("New role")).toBeDefined();
    expect(screen.getByLabelText(/Type the email/i)).toBeDefined();
  });

  it("makes MFA reset high-tier and explains fresh enrollment", () => {
    render(<AdminActionDialogs {...baseProps} action="reset-mfa" />);

    expect(screen.getByText(/must enrol MFA again at the next sign-in/i)).toBeDefined();
    const reason = screen.getByLabelText("Reason");
    const target = screen.getByLabelText(/Type the email/i);
    const confirm = screen.getByRole("button", { name: "Reset MFA" });

    fireEvent.change(reason, { target: { value: "Administrator lost access to authenticator" } });
    fireEvent.change(target, { target: { value: ADMIN.email } });

    expect(confirm).toHaveProperty("disabled", false);
  });

  it("maps the self-modification and last-Super-Admin guards to specific copy", () => {
    expect(
      adminActionErrorMessage(
        new ApiError({ status: 400, rawCode: "ADMIN_SELF_MODIFICATION" }),
      ),
    ).toBe("You cannot change your own administrator role or active state.");
    expect(
      adminActionErrorMessage(
        new ApiError({ status: 400, rawCode: "ADMIN_LAST_SUPER_ADMIN" }),
      ),
    ).toBe("This is the last Super Admin. Appoint another Super Admin before changing this account.");
  });
});
