// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminStaff } from "@/types/admin-staff";

import { AdminTableRowActions } from "./admin-table-actions";

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
  totpConfirmed: false,
  lastLoginAt: null,
  createdAt: "2026-02-01T00:00:00.000Z",
  deletedAt: null,
};

afterEach(cleanup);

describe("AdminTableRowActions (ADM-109)", () => {
  it("exposes role, MFA, and deactivation actions only when manage permission is held", async () => {
    const onAction = vi.fn();
    render(
      <AdminTableRowActions
        admin={ADMIN}
        currentAdminId="another-admin"
        canManage
        onAction={onAction}
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Open actions for Malis Chan" }), {
      button: 0,
      ctrlKey: false,
    });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Change role" })).toBeDefined());
    expect(screen.getByRole("menuitem", { name: "Reset MFA" })).toBeDefined();
    expect(screen.getByRole("menuitem", { name: "Deactivate admin" })).toBeDefined();

    fireEvent.click(screen.getByRole("menuitem", { name: "Reset MFA" }));
    expect(onAction).toHaveBeenCalledWith("reset-mfa", ADMIN);
  });

  it("does not offer role changes for the signed-in administrator", () => {
    render(
      <AdminTableRowActions
        admin={ADMIN}
        currentAdminId={ADMIN.adminId}
        canManage
        onAction={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Current admin account")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Open actions/ })).toBeNull();
  });

  it("renders no management controls without rbac:manage", () => {
    const { container } = render(
      <AdminTableRowActions
        admin={ADMIN}
        currentAdminId="another-admin"
        canManage={false}
        onAction={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
