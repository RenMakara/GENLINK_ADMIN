// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { DataTable, type DataTablePagination } from "./data-table";

interface Person {
  id: string;
  name: string;
  role: string;
}

const rows: Person[] = [
  { id: "1", name: "Dara Sok", role: "Admin" },
  { id: "2", name: "Makara Ren", role: "Reviewer" },
];

const columns: ColumnDef<Person>[] = [
  { accessorKey: "name", header: "Name", enableSorting: true },
  { accessorKey: "role", header: "Role" },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderTable(props: Partial<ComponentProps<typeof DataTable<Person>>> = {}) {
  return render(
    <DataTable<Person>
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      ariaLabel="People"
      {...props}
    />,
  );
}

describe("DataTable (ADM-067)", () => {
  it("keeps table geometry with accessible loading skeleton rows", () => {
    renderTable({ loading: true, loadingRowCount: 3 });

    expect(screen.getByRole("status", { name: "Loading People" })).toBeDefined();
    expect(screen.getAllByRole("row", { hidden: true })).toHaveLength(4);
  });

  it("renders an empty state with a clear-filters action", () => {
    const onClearFilters = vi.fn();
    renderTable({
      data: [],
      emptyState: {
        title: "No users match these filters",
        description: "Try widening the search.",
        onClearFilters,
      },
    });

    expect(screen.getByText("No users match these filters")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });

  it("renders the shared error state and retry action", () => {
    const onRetry = vi.fn();
    renderTable({ error: "The user list could not be loaded.", onRetry });

    expect(screen.getByRole("alert").textContent).toContain("The user list could not be loaded.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("delegates sorting to the page instead of sorting rows locally", () => {
    const sorting: SortingState = [];
    const onSortingChange = vi.fn();
    renderTable({ sorting, onSortingChange });

    const nameHeader = screen.getByRole("button", { name: /Name: activate to sort ascending/i });
    fireEvent.click(nameHeader);

    expect(onSortingChange).toHaveBeenCalledWith([{ id: "name", desc: false }]);
    expect(screen.getByText("Dara Sok")).toBeDefined();
    expect(screen.getByText("Makara Ren")).toBeDefined();
  });

  it("delegates pagination and page-size changes to the page", () => {
    const pagination: DataTablePagination = {
      pageIndex: 0,
      pageSize: 2,
      totalRows: 5,
      onPageIndexChange: vi.fn(),
      onPageSizeChange: vi.fn(),
    };
    renderTable({ pagination });

    expect(screen.getByText("Showing 1–2 of 5")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Rows per page" }), {
      target: { value: "10" },
    });

    expect(pagination.onPageIndexChange).toHaveBeenCalledWith(1);
    expect(pagination.onPageSizeChange).toHaveBeenCalledWith(10);
  });

  it("supports keyboard-accessible column visibility controls", async () => {
    renderTable();

    fireEvent.pointerDown(screen.getByRole("button", { name: "Choose visible columns" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Role" }));

    expect(screen.queryByText("Reviewer")).toBeNull();
    expect(screen.getByText("Dara Sok")).toBeDefined();
  });

  it("supports keyboard row activation and visible focus styles", () => {
    const onRowClick = vi.fn();
    renderTable({ onRowClick, rowAriaLabel: (row) => `Open ${row.name}` });

    const row = screen.getByRole("row", { name: /Open Dara Sok/ });
    expect(row.getAttribute("tabindex")).toBe("0");
    expect(row.className).toContain("focus-visible:ring-2");
    fireEvent.keyDown(row, { key: "Enter" });

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("exposes selection semantics and persists density by storage key", async () => {
    const onRowSelectionChange = vi.fn();
    const rowSelection: RowSelectionState = {};
    const densityStorageKey = "admin:density:adm-067-test";
    const { unmount } = renderTable({
      enableRowSelection: true,
      rowSelection,
      onRowSelectionChange,
      densityStorageKey,
    });

    expect(screen.getByRole("checkbox", { name: "Select all rows on this page" })).toBeDefined();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all rows on this page" }));
    expect(onRowSelectionChange).toHaveBeenCalledWith({ "1": true, "2": true });

    fireEvent.pointerDown(screen.getByRole("button", { name: "Change table density" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Compact" }));
    unmount();
    renderTable({ densityStorageKey });
    expect(screen.getByText("Dara Sok").closest("td")?.className).toContain("py-1.5");
  });

  it("renders row actions without taking ownership of their behavior", () => {
    const onAction = vi.fn();
    renderTable({
      rowActions: (row) => (
        <Button type="button" onClick={onAction} aria-label={`Open actions for ${row.name}`}>
          Actions
        </Button>
      ),
    });

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Dara Sok" }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
