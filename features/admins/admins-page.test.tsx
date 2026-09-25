// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { AdminRoleSummary } from "@/types/admin-role";
import type { AdminStaff } from "@/types/admin-staff";

import { AdminsPage } from "./admins-page";

const permissionState = vi.hoisted(() => ({ canRead: true, canManage: true }));
const service = vi.hoisted(() => ({
  useAdminStaff: vi.fn(),
  useAdminRoles: vi.fn(),
  useChangeAdminRole: vi.fn(),
  useDeactivateAdmin: vi.fn(),
  useResetAdminMfa: vi.fn(),
}));
const mutations = vi.hoisted(() => ({
  changeRole: { mutateAsync: vi.fn(), isPending: false },
  deactivate: { mutateAsync: vi.fn(), isPending: false },
  resetMfa: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({ session: { adminUserId: "admin-1" } }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    ready: true,
    has: (permission: string) =>
      (permission === "rbac:read" && permissionState.canRead) ||
      (permission === "rbac:manage" && permissionState.canManage),
  }),
}));

vi.mock("@/hooks/use-table-state", () => ({
  useTableState: () => ({
    pageIndex: 0,
    pageSize: 25,
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
  }),
}));

vi.mock("@/services/admins", () => ({
  useAdminStaff: service.useAdminStaff,
  useChangeAdminRole: service.useChangeAdminRole,
  useDeactivateAdmin: service.useDeactivateAdmin,
  useResetAdminMfa: service.useResetAdminMfa,
}));

vi.mock("@/services/roles", () => ({
  useAdminRoles: service.useAdminRoles,
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
    description: "Recovery role",
    isSystem: true,
    adminCount: 1,
  },
];

const ADMINS: AdminStaff[] = [
  {
    adminId: "admin-1",
    userId: "user-1",
    fullName: "Sok Dara",
    username: "sokdara",
    email: "admin@genlink.kh",
    roleId: "role-super",
    roleCode: "SUPER_ADMIN",
    roleName: "Super Admin",
    active: true,
    totpEnabled: true,
    totpConfirmed: true,
    lastLoginAt: "2026-09-24T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  },
  {
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
  },
];

const refetch = vi.fn();

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { content: ADMINS, page: 0, size: 25, totalElements: ADMINS.length, totalPages: 1, hasNext: false },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  };
}

function rolesQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: ROLES,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  };
}

function renderPage() {
  service.useAdminStaff.mockReturnValue(listQuery());
  service.useAdminRoles.mockReturnValue(rolesQuery());
  service.useChangeAdminRole.mockReturnValue(mutations.changeRole);
  service.useDeactivateAdmin.mockReturnValue(mutations.deactivate);
  service.useResetAdminMfa.mockReturnValue(mutations.resetMfa);
  return render(<AdminsPage />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  permissionState.canRead = true;
  permissionState.canManage = true;
  mutations.changeRole.mutateAsync.mockResolvedValue(ADMINS[1]);
  mutations.deactivate.mutateAsync.mockResolvedValue(ADMINS[1]);
  mutations.resetMfa.mutateAsync.mockResolvedValue(ADMINS[1]);
});

describe("AdminsPage (ADM-109)", () => {
  it("renders the staff directory and makes MFA gaps visible", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Admin users" })).toBeDefined();
    expect(screen.getByRole("table", { name: "Admin users" })).toBeDefined();
    expect(screen.getByText("Confirmed")).toBeDefined();
    expect(screen.getByText("Setup pending")).toBeDefined();
    expect(screen.getByLabelText("Current admin account")).toBeDefined();
    expect(screen.getByRole("button", { name: "Open actions for Malis Chan" })).toBeDefined();
    expect(service.useAdminStaff).toHaveBeenCalledWith({ page: 0, size: 25 }, true);
  });

  it("gates the directory and action controls on the RBAC read/manage permissions", () => {
    permissionState.canManage = false;
    renderPage();

    expect(screen.queryByRole("button", { name: "Open actions for Malis Chan" })).toBeNull();

    cleanup();
    permissionState.canRead = false;
    renderPage();

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("You do not have permission to view administrator accounts.")).toBeDefined();
    expect(service.useAdminStaff).toHaveBeenLastCalledWith({ page: 0, size: 25 }, false);
    expect(service.useAdminRoles).toHaveBeenLastCalledWith(false);
  });

  it("requires selecting a different role and an audited high-tier confirmation", async () => {
    renderPage();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Open actions for Malis Chan" }), {
      button: 0,
      ctrlKey: false,
    });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Change role" })).toBeDefined());
    fireEvent.click(screen.getByRole("menuitem", { name: "Change role" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("Support", { selector: "strong" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Change role" }).hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("New role"), { target: { value: "role-super" } });
    fireEvent.change(screen.getByLabelText("Reason"), {
      target: { value: "Change role for on-call coverage" },
    });
    fireEvent.change(screen.getByLabelText(/Type the email/), {
      target: { value: "malis@genlink.kh" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Change role" }));

    await waitFor(() => {
      expect(mutations.changeRole.mutateAsync).toHaveBeenCalledWith({
        adminId: "admin-2",
        roleId: "role-super",
        reason: "Change role for on-call coverage",
      });
    });
  });

  it("keeps API errors safe and offers retry", () => {
    service.useAdminStaff.mockReturnValue(
      listQuery({
        data: undefined,
        isError: true,
        error: new ApiError({
          status: 500,
          rawCode: "INTERNAL_SERVER_ERROR",
          serverMessage: "sensitive backend details",
        }),
      }),
    );
    service.useAdminRoles.mockReturnValue(rolesQuery());
    service.useChangeAdminRole.mockReturnValue(mutations.changeRole);
    service.useDeactivateAdmin.mockReturnValue(mutations.deactivate);
    service.useResetAdminMfa.mockReturnValue(mutations.resetMfa);

    render(<AdminsPage />);

    expect(screen.getByText("We could not load administrator accounts right now. Please try again.")).toBeDefined();
    expect(screen.queryByText("sensitive backend details")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
