"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Columns3,
  MoreHorizontal,
  Rows3,
} from "lucide-react";
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { EmptyState, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePersistedTablePreference } from "@/hooks/use-data-table-preferences";
import { cn } from "@/lib/utils";

const SELECTION_COLUMN_ID = "__select";
const ACTIONS_COLUMN_ID = "__actions";
const INTEGER_FORMATTER = new Intl.NumberFormat("en-US");

export type DataTableDensity = "comfortable" | "compact";
export type DataTableColumnDef<TData extends object> = ColumnDef<TData>;
export type DataTableGetRowId<TData extends object> = (
  originalRow: TData,
  index: number,
  parent?: Row<TData>,
) => string;

export interface DataTablePagination {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  pageSizeOptions?: number[];
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableEmptyState {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
}

export interface DataTableProps<TData extends object> {
  /** The current page of rows. Sorting and pagination remain server-controlled. */
  data: TData[];
  /** Typed TanStack column definitions; page-specific business logic stays in the column defs. */
  columns: DataTableColumnDef<TData>[];
  /** Stable row identity used for selection and React keys. */
  getRowId?: DataTableGetRowId<TData>;
  /** Accessible label for the table landmark. */
  ariaLabel?: string;
  /** Optional visible/hidden caption for the table. */
  caption?: ReactNode;
  /** Optional search/filter controls owned by the consuming page. */
  toolbar?: ReactNode;
  /** Current sorting state and server callback. */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Server-side pagination state and callbacks. */
  pagination?: DataTablePagination;
  /** Optional row selection. Selection is controlled when rowSelection is supplied. */
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  /** Optional row activation. Activated rows are also keyboard-operable. */
  onRowClick?: (row: TData) => void;
  rowAriaLabel?: (row: TData) => string;
  /** Optional trailing action column. The action renderer owns its business behaviour. */
  rowActions?: (row: TData) => ReactNode;
  /** Controlled or persisted column visibility. */
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (columnVisibility: VisibilityState) => void;
  defaultColumnVisibility?: VisibilityState;
  columnVisibilityStorageKey?: string;
  /** Controlled or persisted row density. Storage keys should include the admin identity. */
  density?: DataTableDensity;
  onDensityChange?: (density: DataTableDensity) => void;
  densityStorageKey?: string;
  /** Loading keeps table geometry stable with skeleton rows. */
  loading?: boolean;
  loadingRowCount?: number;
  /** Error replaces the table body with the shared retry/error state. */
  error?: ReactNode | null;
  onRetry?: () => void;
  /** Empty state offers a clear-filters action when supplied by the page. */
  emptyState?: DataTableEmptyState;
  /** Makes the header sticky inside the table's scroll container. */
  stickyHeader?: boolean;
  className?: string;
}

function getColumnLabel<TData extends object>(column: Column<TData, unknown>): string {
  const header = column.columnDef.header;
  return typeof header === "string" ? header : column.id;
}

function getHeaderLabel<TData extends object>(column: Column<TData, unknown>): string {
  return getColumnLabel(column);
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ChevronUp className="size-3.5" aria-hidden />;
  if (direction === "desc") return <ChevronDown className="size-3.5" aria-hidden />;
  return <ChevronsUpDown className="size-3.5 text-muted-foreground/70" aria-hidden />;
}

function DataTablePaginationControls({ pagination }: { pagination: DataTablePagination }) {
  const totalPages = Math.max(1, Math.ceil(Math.max(0, pagination.totalRows) / pagination.pageSize));
  const currentPage = Math.min(Math.max(0, pagination.pageIndex), totalPages - 1);
  const firstRow = pagination.totalRows === 0 ? 0 : currentPage * pagination.pageSize + 1;
  const lastRow = Math.min((currentPage + 1) * pagination.pageSize, pagination.totalRows);
  const pageSizeOptions = pagination.pageSizeOptions ?? [10, 25, 50];

  return (
    <div className="flex flex-col gap-3 border-t border-border px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {firstRow}–{lastRow} of {INTEGER_FORMATTER.format(pagination.totalRows)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {pagination.onPageSizeChange ? (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows</span>
            <select
              aria-label="Rows per page"
              value={pagination.pageSize}
              onChange={(event) => pagination.onPageSizeChange?.(Number(event.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <span className="text-xs text-muted-foreground">
          Page {currentPage + 1} of {totalPages}
        </span>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to previous page"
            disabled={currentPage === 0}
            onClick={() => pagination.onPageIndexChange(currentPage - 1)}
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Go to next page"
            disabled={currentPage >= totalPages - 1}
            onClick={() => pagination.onPageIndexChange(currentPage + 1)}
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DataTable<TData extends object>({
  data,
  columns,
  getRowId,
  ariaLabel = "Data table",
  caption,
  toolbar,
  sorting,
  onSortingChange,
  pagination,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  onRowClick,
  rowAriaLabel,
  rowActions,
  columnVisibility,
  onColumnVisibilityChange,
  defaultColumnVisibility,
  columnVisibilityStorageKey,
  density,
  onDensityChange,
  densityStorageKey,
  loading = false,
  loadingRowCount = 5,
  error = null,
  onRetry,
  emptyState,
  stickyHeader = false,
  className,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
  const [storedColumnVisibility, setStoredColumnVisibility] = usePersistedTablePreference<VisibilityState>(
    columnVisibilityStorageKey,
    defaultColumnVisibility ?? {},
    (value): value is VisibilityState =>
      Boolean(
        value &&
          typeof value === "object" &&
          !Array.isArray(value) &&
          Object.values(value).every((visible) => typeof visible === "boolean"),
      ),
  );
  const [storedDensity, setStoredDensity] = usePersistedTablePreference<DataTableDensity>(
    densityStorageKey,
    "comfortable",
    (value): value is DataTableDensity => value === "comfortable" || value === "compact",
  );

  const effectiveSorting = sorting ?? internalSorting;
  const effectiveRowSelection = rowSelection ?? internalRowSelection;
  const effectiveColumnVisibility = columnVisibility ?? storedColumnVisibility;
  const effectiveDensity = density ?? storedDensity;

  const tableColumns = useMemo<ColumnDef<TData>[]>(() => {
    const result = [...columns];

    if (enableRowSelection) {
      result.unshift({
        id: SELECTION_COLUMN_ID,
        enableSorting: false,
        enableHiding: false,
        size: 40,
        header: ({ table }) => {
          const checked = table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false;

          return (
            <Checkbox
              aria-label="Select all rows on this page"
              checked={checked}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              onClick={(event) => event.stopPropagation()}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select row ${row.id}`}
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      });
    }

    if (rowActions) {
      result.push({
        id: ACTIONS_COLUMN_ID,
        header: "Actions",
        enableSorting: false,
        enableHiding: false,
        size: 48,
        cell: ({ row }) => (
          <div data-data-table-interactive className="flex justify-end">
            {rowActions(row.original) ?? (
              <MoreHorizontal className="size-4 text-muted-foreground" aria-hidden />
            )}
          </div>
        ),
      });
    }

    return result;
  }, [columns, enableRowSelection, rowActions]);

  const handleSortingChange: OnChangeFn<SortingState> = (updater: Updater<SortingState>) => {
    const nextSorting = functionalUpdate(updater, effectiveSorting);
    if (sorting === undefined) setInternalSorting(nextSorting);
    onSortingChange?.(nextSorting);
  };

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (
    updater: Updater<RowSelectionState>,
  ) => {
    const nextSelection = functionalUpdate(updater, effectiveRowSelection);
    if (rowSelection === undefined) setInternalRowSelection(nextSelection);
    onRowSelectionChange?.(nextSelection);
  };

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = (
    updater: Updater<VisibilityState>,
  ) => {
    const nextVisibility = functionalUpdate(updater, effectiveColumnVisibility);
    if (columnVisibility === undefined) setStoredColumnVisibility(nextVisibility);
    onColumnVisibilityChange?.(nextVisibility);
  };

  const handleDensityChange = (nextDensity: DataTableDensity) => {
    if (density === undefined) setStoredDensity(nextDensity);
    onDensityChange?.(nextDensity);
  };

  const pageCount = pagination
    ? Math.max(1, Math.ceil(Math.max(0, pagination.totalRows) / pagination.pageSize))
    : undefined;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    onSortingChange: handleSortingChange,
    manualPagination: Boolean(pagination),
    pageCount,
    enableRowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    state: {
      sorting: effectiveSorting,
      rowSelection: effectiveRowSelection,
      columnVisibility: effectiveColumnVisibility,
      ...(pagination
        ? { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } }
        : {}),
    },
  });

  const visibleColumns = table.getVisibleLeafColumns();
  const isEmpty = !loading && !error && data.length === 0;
  const hasHideableColumns = table.getAllLeafColumns().some((column) => column.getCanHide());
  const rowClassName = onRowClick
    ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    : undefined;

  const activateRow = (row: Row<TData>) => {
    if (onRowClick) onRowClick(row.original);
  };

  const shouldIgnoreRowInteraction = (target: EventTarget | null) =>
    target instanceof Element &&
    Boolean(
      target.closest(
        "[data-data-table-interactive], a, button, input, select, textarea, [role=button], [role=checkbox]",
      ),
    );

  return (
    <div data-slot="data-table" className={cn("flex w-full flex-col", className)}>
      {toolbar || hasHideableColumns || densityStorageKey || onDensityChange ? (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {hasHideableColumns ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" aria-label="Choose visible columns">
                    <Columns3 aria-hidden />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table.getAllLeafColumns().map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      disabled={!column.getCanHide()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {getColumnLabel(column)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {densityStorageKey || onDensityChange ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm" aria-label="Change table density">
                    <Rows3 aria-hidden />
                    Density
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Row density</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={effectiveDensity}
                    onValueChange={(value) => {
                      if (value === "comfortable" || value === "compact") handleDensityChange(value);
                    }}
                  >
                    <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <ErrorState
          description={error}
          onRetry={onRetry}
          className="rounded-lg border border-destructive/30 px-4 py-10"
        />
      ) : isEmpty ? (
        <EmptyState
          title={emptyState?.title ?? "No records found"}
          description={emptyState?.description ?? "There are no records to display."}
          action={
            emptyState?.action ??
            (emptyState?.onClearFilters ? (
              <Button type="button" variant="outline" size="sm" onClick={emptyState.onClearFilters}>
                {emptyState.clearFiltersLabel ?? "Clear filters"}
              </Button>
            ) : null)
          }
          className="rounded-lg"
        />
      ) : (
        <div
          className="rounded-lg border border-border bg-card"
          aria-busy={loading}
          aria-label={loading ? `Loading ${ariaLabel}` : undefined}
          role={loading ? "status" : undefined}
        >
          <Table aria-label={ariaLabel}>
            {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className={stickyHeader ? "sticky top-0 z-10 bg-card" : undefined}>
                  {headerGroup.headers.map((header) => {
                    const column = header.column;
                    const sortDirection = column.getIsSorted();
                    const headerLabel = getHeaderLabel(column);

                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        aria-sort={
                          sortDirection === "asc"
                            ? "ascending"
                            : sortDirection === "desc"
                              ? "descending"
                              : column.getCanSort()
                                ? "none"
                                : undefined
                        }
                        className={cn(
                          effectiveDensity === "compact" ? "h-8" : "h-10",
                        )}
                      >
                        {header.isPlaceholder ? null : column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex min-h-8 items-center gap-1 rounded-md px-1 text-left font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={column.getToggleSortingHandler()}
                            aria-label={`${headerLabel}: ${
                              sortDirection === "asc"
                                ? "sorted ascending; activate to sort descending"
                                : sortDirection === "desc"
                                  ? "sorted descending; activate to clear sorting"
                                  : "activate to sort ascending"
                            }`}
                          >
                            {flexRender(column.columnDef.header, header.getContext()) ?? headerLabel}
                            <SortIcon direction={sortDirection} />
                          </button>
                        ) : (
                          flexRender(column.columnDef.header, header.getContext()) ?? headerLabel
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {loading
                ? Array.from({ length: Math.max(1, loadingRowCount) }, (_, rowIndex) => (
                    <TableRow key={`loading-${rowIndex}`} aria-hidden>
                      <TableCell colSpan={Math.max(1, visibleColumns.length)}>
                        <div className="flex items-center gap-3 py-1.5">
                          {visibleColumns.map((column, columnIndex) => (
                            <div
                              key={column.id}
                              className={cn(
                                "h-4 animate-pulse rounded bg-muted motion-reduce:animate-none",
                                columnIndex === 0 ? "w-1/3" : "w-1/5",
                              )}
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                : table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      aria-selected={enableRowSelection ? row.getIsSelected() : undefined}
                      tabIndex={onRowClick ? 0 : undefined}
                      className={cn(rowClassName, effectiveDensity === "compact" && "text-xs")}
                      onClick={(event) => {
                        if (!shouldIgnoreRowInteraction(event.target)) activateRow(row);
                      }}
                      onKeyDown={(event) => {
                        if (shouldIgnoreRowInteraction(event.target)) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          activateRow(row);
                        }
                      }}
                      aria-label={onRowClick ? rowAriaLabel?.(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={effectiveDensity === "compact" ? "py-1.5" : "py-2.5"}
                        >
                          {cell.column.id === SELECTION_COLUMN_ID || cell.column.id === ACTIONS_COLUMN_ID
                            ? flexRender(cell.column.columnDef.cell, cell.getContext())
                            : flexRender(cell.column.columnDef.cell, cell.getContext()) ??
                              (cell.getValue() == null ? "" : String(cell.getValue()))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>

          {pagination ? <DataTablePaginationControls pagination={pagination} /> : null}
        </div>
      )}
    </div>
  );
}
