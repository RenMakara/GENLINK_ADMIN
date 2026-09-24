"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, Clock3, Gavel, ShieldAlert } from "lucide-react";

import { DataTable, type DataTableColumnDef } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/use-permission";
import { useTableState, tableFilterCodecs, type UseTableStateOptions } from "@/hooks/use-table-state";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/date";
import { useUserSanctions } from "@/services/users";

import type { AdminUserSanction } from "./types";
import { useUserSanctionLift } from "./user-sanction-lift";
import { UserSanctionLiftDialog } from "./user-sanction-lift-dialog";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
export const USER_SANCTION_TYPES = ["WARNING", "SUSPENSION", "BAN"] as const;
const USER_SANCTION_FILTER_VALUES = ["ALL", ...USER_SANCTION_TYPES] as const;

type UserSanctionFilter = (typeof USER_SANCTION_FILTER_VALUES)[number];
interface UserSanctionFilters {
  type: UserSanctionFilter;
}

const USER_SANCTION_TABLE_STATE_OPTIONS: UseTableStateOptions<UserSanctionFilters> = {
  filterCodecs: {
    type: tableFilterCodecs.enum(USER_SANCTION_FILTER_VALUES, "ALL"),
  },
  defaultPageSize: PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  pageParam: "sanctionsPage",
  pageSizeParam: "sanctionsSize",
  history: "replace",
};

const TYPE_LABELS: Record<AdminUserSanction["type"], string> = {
  WARNING: "Warning",
  SUSPENSION: "Suspension",
  BAN: "Ban",
};

const TYPE_ICONS: Record<AdminUserSanction["type"], typeof ShieldAlert> = {
  WARNING: ShieldAlert,
  SUSPENSION: Clock3,
  BAN: Ban,
};

function humanizeCode(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SanctionTypeCell({ sanction }: { sanction: AdminUserSanction }) {
  const Icon = TYPE_ICONS[sanction.type];

  return (
    <div className="flex min-w-32 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{TYPE_LABELS[sanction.type]}</span>
    </div>
  );
}

function SanctionStatusCell({ sanction }: { sanction: AdminUserSanction }) {
  if (sanction.active) {
    return (
      <Badge className="bg-warning text-warning-foreground">
        <Gavel aria-hidden="true" />
        Active
      </Badge>
    );
  }

  const expired = !sanction.liftedAt && Boolean(sanction.expiresAt);
  return (
    <Badge variant="secondary">
      {expired ? <Clock3 aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      {expired ? "Expired" : "Lifted"}
    </Badge>
  );
}

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const formatted = formatDateTime(value);
  return (
    <time dateTime={value} title={formatted} className="whitespace-nowrap text-muted-foreground">
      {formatted}
    </time>
  );
}

function ReasonCell({ sanction }: { sanction: AdminUserSanction }) {
  return (
    <div className="min-w-56 max-w-[32rem] whitespace-normal">
      <p className="font-medium">{sanction.reason || "No reason recorded"}</p>
      {sanction.messageEn ? <p className="mt-1 text-xs text-muted-foreground">{sanction.messageEn}</p> : null}
      {sanction.messageKm ? (
        <p lang="km" className="mt-1 break-words text-xs text-muted-foreground">
          {sanction.messageKm}
        </p>
      ) : null}
    </div>
  );
}

function ResolutionCell({ sanction }: { sanction: AdminUserSanction }) {
  if (sanction.liftedAt) {
    return (
      <div className="min-w-36">
        <DateCell value={sanction.liftedAt} />
        <p className="mt-1 max-w-48 whitespace-normal text-xs text-muted-foreground">
          {sanction.liftReason || "Lifted without a reason"}
        </p>
      </div>
    );
  }

  return <DateCell value={sanction.expiresAt} />;
}

const SANCTION_COLUMNS: DataTableColumnDef<AdminUserSanction>[] = [
  {
    accessorKey: "type",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => <SanctionTypeCell sanction={row.original} />,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    enableSorting: false,
    cell: ({ row }) => <span>{humanizeCode(row.original.severity)}</span>,
  },
  {
    accessorKey: "active",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <SanctionStatusCell sanction={row.original} />,
  },
  {
    accessorKey: "reason",
    header: "Reason and message",
    enableSorting: false,
    cell: ({ row }) => <ReasonCell sanction={row.original} />,
  },
  {
    accessorKey: "startsAt",
    header: "Started",
    enableSorting: false,
    cell: ({ row }) => <DateCell value={row.original.startsAt} />,
  },
  {
    accessorKey: "expiresAt",
    header: "Resolution",
    enableSorting: false,
    cell: ({ row }) => <ResolutionCell sanction={row.original} />,
  },
  {
    accessorKey: "issuedByAdminName",
    header: "Issued by",
    enableSorting: false,
    cell: ({ row }) => <span>{row.original.issuedByAdminName || "—"}</span>,
  },
];

function enforcementErrorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view this user's enforcement history.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The enforcement service is unavailable. Check the API connection and try again.";
  }
  return "We could not load this user's enforcement history right now. Please try again.";
}

function filterLabel(filter: UserSanctionFilter): string {
  return filter === "ALL" ? "all enforcement records" : TYPE_LABELS[filter];
}

/** ADM-095: one newest-first timeline for warnings, suspensions, and bans. */
export function UserEnforcementTab({ userId }: { userId: string }) {
  const tableState = useTableState<UserSanctionFilters>(USER_SANCTION_TABLE_STATE_OPTIONS);
  const [selectedSanction, setSelectedSanction] = useState<AdminUserSanction | null>(null);
  const { has } = usePermissions();
  const canLift = has("user:unban");
  const lift = useUserSanctionLift(userId);
  const query = useMemo(
    () => ({
      page: tableState.pageIndex,
      size: tableState.pageSize,
      ...(tableState.filters.type === "ALL" ? {} : { type: tableState.filters.type }),
    }),
    [tableState.filters.type, tableState.pageIndex, tableState.pageSize],
  );
  const sanctionsQuery = useUserSanctions(userId, query);
  const sanctions = sanctionsQuery.data?.content ?? [];
  const hasTypeFilter = tableState.filters.type !== "ALL";

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Enforcement timeline</CardTitle>
        <CardDescription>
          Warnings, suspensions, and bans in one newest-first timeline. Active records remain
          visually distinct from lifted or expired records.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <DataTable
          data={sanctions}
          columns={SANCTION_COLUMNS}
          getRowId={(sanction) => sanction.sanctionId}
          ariaLabel="User enforcement timeline"
          caption="Warnings, suspensions, and bans for this user"
          toolbar={
            <div className="flex w-full flex-wrap items-end justify-between gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Filter by type
                </span>
                <select
                  aria-label="Filter enforcement by type"
                  value={tableState.filters.type}
                  onChange={(event) =>
                    tableState.setFilter("type", event.currentTarget.value as UserSanctionFilter)
                  }
                  className="h-9 min-w-44 rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="ALL">All types</option>
                  {USER_SANCTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-muted-foreground">
                Showing {filterLabel(tableState.filters.type)}
              </p>
            </div>
          }
          pagination={{
            pageIndex: tableState.pageIndex,
            pageSize: tableState.pageSize,
            pageSizeOptions: [...PAGE_SIZE_OPTIONS],
            totalRows: sanctionsQuery.data?.totalElements ?? 0,
            onPageIndexChange: tableState.setPageIndex,
            onPageSizeChange: tableState.setPageSize,
          }}
          rowActions={(sanction) =>
            canLift && sanction.active ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-data-table-interactive
                aria-label={`Lift ${TYPE_LABELS[sanction.type].toLowerCase()} sanction`}
                onClick={() => setSelectedSanction(sanction)}
                disabled={lift.pending}
              >
                {lift.pending && lift.pendingSanctionId === sanction.sanctionId
                  ? "Lifting…"
                  : "Lift"}
              </Button>
            ) : (
              <span className="px-2 text-xs text-muted-foreground" aria-label="No action available">
                —
              </span>
            )
          }
          loading={sanctionsQuery.isLoading}
          loadingRowCount={6}
          error={sanctionsQuery.isError ? enforcementErrorDescription(sanctionsQuery.error) : null}
          onRetry={() => void sanctionsQuery.refetch()}
          emptyState={{
            title: hasTypeFilter ? `No ${filterLabel(tableState.filters.type)} records` : "No enforcement records",
            description: hasTypeFilter
              ? "Try showing all enforcement types."
              : "No warnings, suspensions, or bans are recorded for this user.",
            onClearFilters: tableState.reset,
            clearFiltersLabel: "Show all types",
          }}
          stickyHeader
          className="min-w-0"
        />
      </CardContent>

      <UserSanctionLiftDialog
        sanction={selectedSanction}
        pending={lift.pending}
        onOpenChange={(open) => {
          if (!open) setSelectedSanction(null);
        }}
        onConfirm={(sanctionId, reason) => lift.execute({ sanctionId, reason })}
      />
    </Card>
  );
}
