// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminPermissionGroup, AdminRoleDetail } from "@/types/admin-role";

import { RoleEditorPage } from "./role-editor-page";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

const permissionState = vi.hoisted(() => ({
  canRead: true,
  canManage: true,
}));

const service = vi.hoisted(() => ({
  useAdminRole: vi.fn(),
  useAdminPermissionGroups: vi.fn(),
  useReplaceAdminRolePermissions: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    ready: true,
    has: (permission: string) =>
      permission === "rbac:read"
        ? permissionState.canRead
        : permission === "rbac:manage" && permissionState.canManage,
  }),
}));

vi.mock("@/services/roles", () => ({
  useAdminRole: service.useAdminRole,
  useAdminPermissionGroups: service.useAdminPermissionGroups,
  useReplaceAdminRolePermissions: service.useReplaceAdminRolePermissions,
}));

const ROLE: AdminRoleDetail = {
  roleId: "role-support",
  code: "SUPPORT",
  name: "Support",
  description: "Unblocks users; cannot punish them.",
  isSystem: true,
  adminCount: 2,
  permissions: ["dashboard:view", "user:read"],
};

const SUPER_ADMIN: AdminRoleDetail = {
  ...ROLE,
  roleId: "role-super-admin",
  code: "SUPER_ADMIN",
  name: "Super Admin",
  adminCount: 1,
  permissions: ["dashboard:view", "user:read", "user:ban"],
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
      {
        code: "user:ban",
        resource: "user",
        action: "ban",
        description: "Ban a user permanently",
      },
    ],
  },
];

const mutateAsync = vi.fn();

function queryResult<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

function renderEditor(role: AdminRoleDetail = ROLE) {
  service.useAdminRole.mockReturnValue(queryResult(role));
  service.useAdminPermissionGroups.mockReturnValue(queryResult(GROUPS));
  service.useReplaceAdminRolePermissions.mockReturnValue({
    mutateAsync,
    isPending: false,
  });
  return render(<RoleEditorPage roleId={role.roleId} />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  permissionState.canRead = true;
  permissionState.canManage = true;
  vi.restoreAllMocks();
  mutateAsync.mockResolvedValue({ ...ROLE });
});

describe("RoleEditorPage (ADM-108)", () => {
  it("renders the grouped matrix and saves the complete selected set with a reason", async () => {
    mutateAsync.mockResolvedValue({ ...ROLE, permissions: ["dashboard:view", "user:read", "user:ban"] });
    renderEditor();

    expect(screen.getByRole("heading", { name: "Role editor" })).toBeDefined();
    expect(screen.getByText("Support")).toBeDefined();
    expect(
      screen.getByRole("checkbox", { name: "Grant all User permissions" }).getAttribute("data-state"),
    ).toBe("indeterminate");
    expect(screen.getByRole("button", { name: "Save permissions" }).hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("checkbox", { name: "Grant all User permissions" }));
    expect(screen.getByRole("button", { name: "Save permissions" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Save permissions" }));

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.change(within(dialog).getByLabelText("Reason"), {
      target: { value: "Reviewed role access during quarterly audit" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save permissions" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        roleId: "role-support",
        permissions: ["dashboard:view", "user:read", "user:ban"],
        reason: "Reviewed role access during quarterly audit",
      });
    });
  });

  it("keeps SUPER_ADMIN read-only even when the viewer can manage RBAC", () => {
    renderEditor(SUPER_ADMIN);

    expect(
      screen.getByText("SUPER_ADMIN permissions are implicit in the application and cannot be edited."),
    ).toBeDefined();
    expect(
      screen.getByRole("checkbox", { name: "Grant all User permissions" }).hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByRole("button", { name: "Save permissions" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows a read-only matrix without rbac:manage", () => {
    permissionState.canManage = false;
    renderEditor();

    expect(
      screen.getByText(
        "Your administrator role has read-only access. The rbac:manage permission is required to edit this matrix.",
      ),
    ).toBeDefined();
    expect(
      screen.getByRole("checkbox", { name: "Grant all User permissions" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("blocks refresh/navigation while changes are dirty", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("checkbox", { name: "Grant all User permissions" }));

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Back to roles" }));
    expect(confirm).toHaveBeenCalledWith("You have unsaved permission changes. Leave without saving?");
    expect(navigation.push).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Back to roles" }));
    expect(navigation.push).toHaveBeenCalledWith("/roles");
  });
});
