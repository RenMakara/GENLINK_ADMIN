// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DataTable } from "@/components/data-table";

import { createRoleTableColumns } from "./role-table-columns";
import type { AdminRoleSummary } from "@/types/admin-role";

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
    description: null,
    isSystem: true,
    adminCount: 12,
  },
];

afterEach(cleanup);

describe("role table columns (ADM-107)", () => {
  it("renders names, codes, descriptions, counts, and system lock affordances", () => {
    render(
      <DataTable
        data={ROLES}
        columns={createRoleTableColumns()}
        getRowId={(role) => role.roleId}
        ariaLabel="Admin roles"
      />,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByText("Super Admin")).toBeDefined();
    expect(screen.getByText("SUPER_ADMIN")).toBeDefined();
    expect(screen.getByText("Owner. Manages admins and system settings.")).toBeDefined();
    expect(screen.getAllByText("System")).toHaveLength(2);
    expect(screen.getAllByTitle("System role cannot be deleted")).toHaveLength(2);
    expect(screen.getByText("12")).toBeDefined();
    expect(screen.getByText("No description")).toBeDefined();
  });
});
