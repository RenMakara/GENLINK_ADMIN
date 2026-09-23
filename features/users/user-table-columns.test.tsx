// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "@/components/data-table";

import {
  createUserTableColumns,
  DEFAULT_USER_TABLE_SORTING,
  UserTableRowActions,
} from "./user-table-columns";
import type { AdminUserTableRow } from "./types";

const NOW = new Date("2026-09-23T00:00:00.000Z");

const USER: AdminUserTableRow = {
  userId: "user-1",
  fullName: "Morm Rotana",
  username: "morm.rotana",
  email: "morm.rotana@example.com",
  avatarUrl: null,
  emailVerified: true,
  accountStatus: "ACTIVE",
  adminRoleName: "Moderator",
  universityName: "Royal University of Phnom Penh",
  workStatus: "YOUNG_PROFESSIONAL",
  level: 7,
  totalXp: 1240,
  createdAt: "2026-06-23T00:00:00.000Z",
  lastActiveAt: "2026-09-22T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderUserTable(
  user: AdminUserTableRow = USER,
  onViewDetails: (row: AdminUserTableRow) => void = vi.fn(),
) {
  return render(
    <DataTable
      data={[user]}
      columns={createUserTableColumns({ now: NOW })}
      getRowId={(row) => row.userId}
      ariaLabel="Users"
      enableRowSelection
      rowActions={(row) => <UserTableRowActions user={row} onViewDetails={onViewDetails} />}
    />,
  );
}

describe("user table columns (ADM-069)", () => {
  it("renders the complete user row with shell selection and action columns", () => {
    renderUserTable();

    expect(screen.getAllByRole("columnheader")).toHaveLength(11);
    expect(screen.getByText("Morm Rotana")).toBeDefined();
    expect(screen.getByText("@morm.rotana")).toBeDefined();
    expect(screen.getByText("morm.rotana@example.com")).toBeDefined();
    expect(screen.getByRole("img", { name: "Email verified" })).toBeDefined();
    expect(screen.getByText("Active")).toBeDefined();
    expect(screen.getByText("Moderator")).toBeDefined();
    expect(screen.getByText("Royal University of Phnom Penh")).toBeDefined();
    expect(screen.getByText("Young professional")).toBeDefined();
    expect(screen.getByText("Lv 7")).toBeDefined();
    expect(screen.getByText("1,240 XP")).toBeDefined();
    expect(screen.getByText("3 months ago").getAttribute("title")).toBe("23 Jun 2026, 07:00");
    expect(screen.getByText("yesterday")).toBeDefined();
    expect(screen.getByRole("checkbox", { name: "Select row user-1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Open actions for Morm Rotana" })).toBeDefined();
  });

  it("uses explicit status text and an accessible unverified indicator", () => {
    renderUserTable({
      ...USER,
      accountStatus: "SUSPENDED",
      emailVerified: false,
      adminRoleName: null,
      lastActiveAt: null,
    });

    expect(screen.getByText("Suspended")).toBeDefined();
    expect(screen.getByRole("img", { name: "Email not verified" })).toBeDefined();
    expect(screen.getByLabelText("No admin role")).toBeDefined();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("marks the server-sortable columns and delegates sorting to the shell", () => {
    const onSortingChange = vi.fn();
    render(
      <DataTable
        data={[USER]}
        columns={createUserTableColumns({ now: NOW })}
        getRowId={(row) => row.userId}
        ariaLabel="Users"
        sorting={[]}
        onSortingChange={onSortingChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Email: activate to sort ascending/i }));

    expect(onSortingChange).toHaveBeenCalledWith([{ id: "email", desc: false }]);
    expect(screen.getByText("Lv 7").parentElement?.className).toContain("tabular-nums");
    expect(DEFAULT_USER_TABLE_SORTING).toEqual([{ id: "createdAt", desc: true }]);
  });

  it("opens the row action menu and leaves the action callback to the feature page", async () => {
    const onViewDetails = vi.fn();
    renderUserTable(USER, onViewDetails);

    fireEvent.pointerDown(screen.getByRole("button", { name: "Open actions for Morm Rotana" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByRole("menuitem", { name: "View user details" }));

    expect(onViewDetails).toHaveBeenCalledWith(USER);
  });
});
