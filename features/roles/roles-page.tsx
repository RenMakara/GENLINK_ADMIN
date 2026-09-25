"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/data-table";
import { ErrorState, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permission";
import { ApiError } from "@/lib/api/errors";
import { useAdminRoles } from "@/services/roles";

import { createRoleTableColumns } from "./role-table-columns";
import { RolesPageSkeleton } from "./roles-page-skeleton";

function rolesErrorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view admin roles.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The Roles service is unavailable. Check the API connection and try again.";
  }
  return "We could not load admin roles right now. Please try again.";
}

export function RolesPage() {
  const router = useRouter();
  const { has, ready } = usePermissions();
  const canReadRoles = ready && has("rbac:read");
  const rolesQuery = useAdminRoles(canReadRoles);
  const columns = useMemo(() => createRoleTableColumns(), []);
  const roles = rolesQuery.data ?? [];

  if (!ready) {
    return <RolesPageSkeleton />;
  }

  if (!canReadRoles) {
    return (
      <div className="flex w-full flex-col gap-6">
        <PageHeader
          title="Roles & Permissions"
          description="Review staff roles and the administrators assigned to them."
        />
        <ErrorState
          title="Access restricted"
          description="You do not have permission to view admin roles."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">
        {rolesQuery.isFetching ? "Updating admin roles..." : "Admin roles up to date."}
      </div>

      <PageHeader
        title="Roles & Permissions"
        description="Review staff roles and the administrators assigned to them."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void rolesQuery.refetch()}
            disabled={rolesQuery.isFetching}
            aria-label="Refresh roles"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${rolesQuery.isFetching ? "motion-safe:animate-spin" : ""} motion-reduce:animate-none`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <DataTable
        data={roles}
        columns={columns}
        getRowId={(role) => role.roleId}
        ariaLabel="Admin roles"
        caption="GenLink KH administrator roles"
        onRowClick={(role) => router.push(`/roles/${encodeURIComponent(role.roleId)}`)}
        rowAriaLabel={(role) => `Open editor for ${role.name}`}
        loading={rolesQuery.isLoading}
        error={rolesQuery.isError ? rolesErrorDescription(rolesQuery.error) : null}
        onRetry={() => void rolesQuery.refetch()}
        emptyState={{
          title: "No admin roles",
          description: "No staff roles are available to display.",
        }}
        stickyHeader
        columnVisibilityStorageKey="genlink-admin-roles-columns"
        densityStorageKey="genlink-admin-roles-density"
      />
    </div>
  );
}
