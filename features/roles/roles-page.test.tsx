// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/errors";
import type { AdminRoleSummary } from "@/types/admin-role";

import { RolesPage } from "./roles-page";

const navigation = vi.hoisted(() => ({
  push: vi.fn(),
}));

const permissionState = vi.hoisted(() => ({
  canRead: true,
}));

const service = vi.hoisted(() => ({
  useAdminRoles: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({
    ready: true,
    has: (permission: string) => permission === "rbac:read" && permissionState.canRead,
  }),
}));

vi.mock("@/services/roles", () => ({
  useAdminRoles: service.useAdminRoles,
}));

const ROLES: AdminRoleSummary[] = [
  {
    roleId: "role-super-admin",
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Owner. Manages admins and system settings.",
    isSystem: true,
    adminCount: 1,
  },
  {
    roleId: "role-support",
    code: "SUPPORT",
    name: "Support",
    description: "Unblocks users; cannot punish them.",
    isSystem: true,
    adminCount: 2,
  },
];

const refetch = vi.fn();

function successQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: ROLES,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  permissionState.canRead = true;
});

describe("RolesPage (ADM-107)", () => {
  it("renders role metadata and opens the editor route from a keyboard-operable row", () => {
    service.useAdminRoles.mockReturnValue(successQuery());

    render(<RolesPage />);

    expect(screen.getByRole("heading", { name: "Roles & Permissions" })).toBeDefined();
    expect(screen.getByRole("table", { name: "Admin roles" })).toBeDefined();
    expect(screen.getByText("Super Admin")).toBeDefined();
    expect(screen.getAllByText("System")).toHaveLength(2);
    expect(service.useAdminRoles).toHaveBeenCalledWith(true);

    const row = screen.getByRole("row", { name: "Open editor for Support" });
    fireEvent.keyDown(row, { key: "Enter" });

    expect(navigation.push).toHaveBeenCalledWith("/roles/role-support");
  });

  it("does not request or render the list without rbac:read", () => {
    permissionState.canRead = false;
    service.useAdminRoles.mockReturnValue(successQuery());

    render(<RolesPage />);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("You do not have permission to view admin roles.")).toBeDefined();
    expect(screen.queryByRole("table", { name: "Admin roles" })).toBeNull();
    expect(service.useAdminRoles).toHaveBeenCalledWith(false);
  });

  it("keeps API errors safe and provides retry", () => {
    service.useAdminRoles.mockReturnValue(
      successQuery({
        data: undefined,
        isError: true,
        error: new ApiError({
          status: 500,
          rawCode: "INTERNAL_SERVER_ERROR",
          serverMessage: "database credentials must not be displayed",
        }),
      }),
    );

    render(<RolesPage />);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("We could not load admin roles right now. Please try again.")).toBeDefined();
    expect(screen.queryByText("database credentials must not be displayed")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("distinguishes loading and empty states", () => {
    service.useAdminRoles.mockReturnValue(successQuery({ data: undefined, isLoading: true }));
    const view = render(<RolesPage />);

    expect(screen.getByRole("status", { name: "Loading Admin roles" })).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();

    service.useAdminRoles.mockReturnValue(successQuery({ data: [] }));
    view.rerender(<RolesPage />);

    expect(screen.getByText("No admin roles")).toBeDefined();
  });
});
