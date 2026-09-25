// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DataTable } from "@/components/data-table";
import type { AdminStaff } from "@/types/admin-staff";

import { createAdminTableColumns } from "./admin-table-columns";

const NOW = new Date("2026-09-25T00:00:00.000Z");
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
  {
    adminId: "admin-3",
    userId: "user-3",
    fullName: "Vannak Lim",
    username: "vannaklim",
    email: "vannak@genlink.kh",
    roleId: "role-support",
    roleCode: "SUPPORT",
    roleName: "Support",
    active: false,
    totpEnabled: false,
    totpConfirmed: false,
    lastLoginAt: "2026-04-01T00:00:00.000Z",
    createdAt: "2026-03-01T00:00:00.000Z",
    deletedAt: "2026-08-01T00:00:00.000Z",
  },
];

afterEach(cleanup);

describe("admin table columns (ADM-109)", () => {
  it("makes MFA status prominent and renders safe staff state", () => {
    render(
      <DataTable
        data={ADMINS}
        columns={createAdminTableColumns({ now: NOW })}
        getRowId={(admin) => admin.adminId}
        ariaLabel="Admin users"
      />,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
    expect(screen.getByText("Sok Dara")).toBeDefined();
    expect(screen.getByText("Super Admin")).toBeDefined();
    expect(screen.getByText("Confirmed")).toBeDefined();
    expect(screen.getByText("Setup pending")).toBeDefined();
    expect(screen.getByText("Not enrolled")).toBeDefined();
    expect(screen.getByText("Never")).toBeDefined();
    expect(screen.getByText("Revoked")).toBeDefined();
  });
});
