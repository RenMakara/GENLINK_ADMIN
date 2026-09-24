"use client";

import { useCallback, useMemo, useState } from "react";
import type { RowSelectionState } from "@tanstack/react-table";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/errors";
import {
  DEFAULT_USER_TABLE_SORTING,
  USER_TABLE_SORTABLE_COLUMN_IDS,
  UserTableRowActions,
  createUserTableColumns,
} from "@/features/users/user-table-columns";
import { UserFilterBar } from "@/features/users/user-filter-bar";
import { UserSearchInput } from "@/features/users/user-search-input";
import { BulkActionBar } from "@/features/users/bulk-action-bar";
import {
  createDefaultUserFilters,
  USER_FILTER_CODECS,
  type UserFilters,
} from "@/features/users/user-filters";
import { useTableState, type UseTableStateOptions } from "@/hooks/use-table-state";
import { useUserList, buildUserListQuery } from "@/services/users";

const USER_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const USER_TABLE_STATE_OPTIONS: UseTableStateOptions<UserFilters> = {
  sortableColumnIds: USER_TABLE_SORTABLE_COLUMN_IDS,
  filterCodecs: USER_FILTER_CODECS,
  defaultSorting: DEFAULT_USER_TABLE_SORTING,
  defaultPageSize: USER_PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: USER_PAGE_SIZE_OPTIONS,
  searchDebounceMs: 300,
};

function hasActiveUserFilters(filters: UserFilters): boolean {
  return (
    filters.status.length > 0 ||
    filters.emailVerified !== "ANY" ||
    filters.workStatus.length > 0 ||
    filters.university !== "" ||
    filters.gender.length > 0 ||
    filters.language.length > 0 ||
    filters.authProvider.length > 0 ||
    filters.levelMin !== null ||
    filters.levelMax !== null ||
    filters.xpMin !== null ||
    filters.xpMax !== null ||
    filters.createdFrom !== "" ||
    filters.createdTo !== "" ||
    filters.lastActive !== "" ||
    filters.banned ||
    filters.includeDeleted
  );
}

function userListErrorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view user records.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The Users service is unavailable. Check the API connection and try again.";
  }
  return "We could not load user records right now. Please try again.";
}

export function UsersPage() {
  const router = useRouter();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const tableState = useTableState<UserFilters>(USER_TABLE_STATE_OPTIONS);
  const listQueryParams = useMemo(
    () =>
      buildUserListQuery({
        search: tableState.search,
        filters: tableState.filters,
        sorting: tableState.sorting,
        pageIndex: tableState.pageIndex,
        pageSize: tableState.pageSize,
      }),
    [
      tableState.filters,
      tableState.pageIndex,
      tableState.pageSize,
      tableState.search,
      tableState.sorting,
    ],
  );
  const usersQuery = useUserList(listQueryParams);
  const columns = useMemo(() => createUserTableColumns(), []);
  const users = useMemo(() => usersQuery.data?.content ?? [], [usersQuery.data?.content]);
  const selectedUserIds = useMemo(
    () => Object.entries(rowSelection).filter(([, selected]) => selected).map(([userId]) => userId),
    [rowSelection],
  );
  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.userId)),
    [selectedUserIds, users],
  );
  const hasFilters = hasActiveUserFilters(tableState.filters);
  const { setFilters } = tableState;

  const clearFilters = useCallback(() => {
    setFilters(createDefaultUserFilters());
  }, [setFilters]);

  const openUserDetails = useCallback(
    (userId: string) => {
      router.push(`/users/${encodeURIComponent(userId)}`);
    },
    [router],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">
        {usersQuery.isFetching ? "Updating user records..." : "User records up to date."}
      </div>

      <PageHeader
        title="Users"
        description="Search, filter, and inspect GenLink KH accounts."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void usersQuery.refetch()}
            disabled={usersQuery.isFetching}
            aria-label="Refresh users"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${usersQuery.isFetching ? "motion-safe:animate-spin" : ""} motion-reduce:animate-none`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        getRowId={(user) => user.userId}
        ariaLabel="Users"
        caption="GenLink KH user accounts"
        toolbar={
          <div className="flex w-full flex-col gap-3">
            <UserSearchInput value={tableState.search} onValueChange={tableState.setSearch} />
            <UserFilterBar
              filters={tableState.filters}
              onFiltersChange={tableState.setFilters}
              onClearAll={clearFilters}
            />
          </div>
        }
        sorting={tableState.sorting}
        onSortingChange={tableState.setSorting}
        pagination={{
          pageIndex: tableState.pageIndex,
          pageSize: tableState.pageSize,
          pageSizeOptions: [...USER_PAGE_SIZE_OPTIONS],
          totalRows: usersQuery.data?.totalElements ?? 0,
          onPageIndexChange: tableState.setPageIndex,
          onPageSizeChange: tableState.setPageSize,
        }}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onRowClick={(user) => openUserDetails(user.userId)}
        rowAriaLabel={(user) => `Open details for ${user.fullName}`}
        rowActions={(user) => (
          <UserTableRowActions user={user} onViewDetails={(row) => openUserDetails(row.userId)} />
        )}
        loading={usersQuery.isLoading}
        error={usersQuery.isError ? userListErrorDescription(usersQuery.error) : null}
        onRetry={() => void usersQuery.refetch()}
        emptyState={{
          title: tableState.search || hasFilters ? "No matching users" : "No users found",
          description:
            tableState.search || hasFilters
              ? "Try a different search or clear the current table state."
              : "No user records are available yet.",
          onClearFilters: tableState.reset,
          clearFiltersLabel: "Clear search and filters",
        }}
        stickyHeader
        columnVisibilityStorageKey="genlink-admin-users-columns"
        densityStorageKey="genlink-admin-users-density"
      />

      <BulkActionBar
        selectedUserIds={selectedUserIds}
        selectedUsers={selectedUsers}
        onClearSelection={() => setRowSelection({})}
      />
    </div>
  );
}
