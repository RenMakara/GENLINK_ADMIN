"use client";

import { useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { ErrorState, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useCurrentAdminId } from "@/hooks/use-current-admin";
import { usePermissions } from "@/hooks/use-permission";
import { useTableState, type UseTableStateOptions } from "@/hooks/use-table-state";
import { ApiError } from "@/lib/api/errors";
import {
  useAdminRoles,
} from "@/services/roles";
import {
  useAdminStaff,
  useChangeAdminRole,
  useDeactivateAdmin,
  useResetAdminMfa,
} from "@/services/admins";
import type { AdminStaff } from "@/types/admin-staff";

import { AdminActionDialogs, type AdminAction } from "./admin-action-dialogs";
import { AdminTableRowActions } from "./admin-table-actions";
import { createAdminTableColumns } from "./admin-table-columns";
import { AdminsPageSkeleton } from "./admins-page-skeleton";

const ADMIN_PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const ADMIN_TABLE_STATE_OPTIONS: UseTableStateOptions<Record<string, never>> = {
  defaultPageSize: ADMIN_PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: ADMIN_PAGE_SIZE_OPTIONS,
};

function adminListErrorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view administrator accounts.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The Administrator service is unavailable. Check the API connection and try again.";
  }
  return "We could not load administrator accounts right now. Please try again.";
}

export function AdminsPage() {
  const currentAdminId = useCurrentAdminId();
  const { has, ready } = usePermissions();
  const [actionState, setActionState] = useState<{
    action: AdminAction;
    admin: AdminStaff;
  } | null>(null);
  const tableState = useTableState<Record<string, never>>(ADMIN_TABLE_STATE_OPTIONS);
  const canRead = ready && has("rbac:read");
  const canManage = ready && has("rbac:manage");
  const adminListQuery = useMemo(
    () => ({ page: tableState.pageIndex, size: tableState.pageSize }),
    [tableState.pageIndex, tableState.pageSize],
  );
  const adminsQuery = useAdminStaff(adminListQuery, canRead);
  const rolesQuery = useAdminRoles(canRead);
  const changeRole = useChangeAdminRole();
  const deactivate = useDeactivateAdmin();
  const resetMfa = useResetAdminMfa();
  const columns = useMemo(() => createAdminTableColumns(), []);
  const admins = adminsQuery.data?.content ?? [];

  const openAction = useCallback((action: AdminAction, admin: AdminStaff) => {
    setActionState({ action, admin });
  }, []);

  const closeAction = useCallback((open: boolean) => {
    if (!open) setActionState(null);
  }, []);

  const handleChangeRole = useCallback(
    async (roleId: string, reason: string) => {
      if (!actionState || actionState.action !== "change-role") return;
      await changeRole.mutateAsync({ adminId: actionState.admin.adminId, roleId, reason });
    },
    [actionState, changeRole],
  );

  const handleDeactivate = useCallback(
    async (reason: string) => {
      if (!actionState || actionState.action !== "deactivate") return;
      await deactivate.mutateAsync({ adminId: actionState.admin.adminId, reason });
    },
    [actionState, deactivate],
  );

  const handleResetMfa = useCallback(
    async (reason: string) => {
      if (!actionState || actionState.action !== "reset-mfa") return;
      await resetMfa.mutateAsync({ adminId: actionState.admin.adminId, reason });
    },
    [actionState, resetMfa],
  );

  if (!ready) {
    return <AdminsPageSkeleton />;
  }

  if (!canRead) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader
          title="Admin users"
          description="Review staff access, role assignments, and two-factor security status."
        />
        <ErrorState
          title="Access restricted"
          description="You do not have permission to view administrator accounts."
        />
      </div>
    );
  }

  const pending =
    (actionState?.action === "change-role" && changeRole.isPending) ||
    (actionState?.action === "deactivate" && deactivate.isPending) ||
    (actionState?.action === "reset-mfa" && resetMfa.isPending);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">
        {adminsQuery.isFetching ? "Updating administrator accounts..." : "Administrator accounts up to date."}
      </div>

      <PageHeader
        title="Admin users"
        description="Review staff access, role assignments, and two-factor security status."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void adminsQuery.refetch()}
            disabled={adminsQuery.isFetching}
            aria-label="Refresh administrator accounts"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${adminsQuery.isFetching ? "motion-safe:animate-spin" : ""} motion-reduce:animate-none`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <DataTable
        data={admins}
        columns={columns}
        getRowId={(admin) => admin.adminId}
        ariaLabel="Admin users"
        caption="GenLink KH administrator accounts"
        pagination={{
          pageIndex: tableState.pageIndex,
          pageSize: tableState.pageSize,
          pageSizeOptions: [...ADMIN_PAGE_SIZE_OPTIONS],
          totalRows: adminsQuery.data?.totalElements ?? 0,
          onPageIndexChange: tableState.setPageIndex,
          onPageSizeChange: tableState.setPageSize,
        }}
        rowActions={
          canManage
            ? (admin) => (
                <AdminTableRowActions
                  admin={admin}
                  currentAdminId={currentAdminId}
                  canManage={canManage}
                  onAction={openAction}
                />
              )
            : undefined
        }
        loading={adminsQuery.isLoading}
        error={adminsQuery.isError ? adminListErrorDescription(adminsQuery.error) : null}
        onRetry={() => void adminsQuery.refetch()}
        emptyState={{
          title: "No administrator accounts",
          description: "No active or revoked staff profiles are available to display.",
        }}
        stickyHeader
        columnVisibilityStorageKey="genlink-admin-admins-columns"
        densityStorageKey="genlink-admin-admins-density"
      />

      <AdminActionDialogs
        action={actionState?.action ?? null}
        admin={actionState?.admin ?? null}
        roles={rolesQuery.data ?? []}
        rolesLoading={rolesQuery.isLoading}
        rolesError={rolesQuery.isError}
        pending={pending}
        onOpenChange={closeAction}
        onChangeRole={handleChangeRole}
        onDeactivate={handleDeactivate}
        onResetMfa={handleResetMfa}
      />
    </div>
  );
}
