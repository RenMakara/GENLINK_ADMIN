"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { Ban, CheckCircle2, ChevronDown, Clock3, Gavel, RefreshCw, ShieldAlert, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

import { DataTable, type DataTableColumnDef } from "@/components/data-table";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePermissions } from "@/hooks/use-permission";
import { useTableState, type UseTableStateOptions } from "@/hooks/use-table-state";
import { ApiError } from "@/lib/api/errors";
import { formatDateTime } from "@/lib/utils/date";
import {
  useAdminSanctions,
  type AdminSanctionListQuery,
} from "@/services/sanctions";

import { UserSanctionLiftDialog } from "@/components/enforcement/user-sanction-lift-dialog";
import { useSanctionLift } from "@/hooks/use-sanction-lift";
import type { AdminUserSanction } from "@/types/admin-sanction";

import {
  ENFORCEMENT_FILTER_CODECS,
  ENFORCEMENT_SEVERITIES,
  ENFORCEMENT_SEVERITY_LABELS,
  ENFORCEMENT_TYPES,
  ENFORCEMENT_TYPE_LABELS,
  type EnforcementFilters,
} from "./enforcement-filters";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const ENFORCEMENT_TABLE_STATE_OPTIONS: UseTableStateOptions<EnforcementFilters> = {
  filterCodecs: ENFORCEMENT_FILTER_CODECS,
  defaultPageSize: PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  pageParam: "enforcementPage",
  pageSizeParam: "enforcementSize",
  history: "replace",
};

const TYPE_ICONS: Record<AdminUserSanction["type"], typeof ShieldAlert> = {
  WARNING: ShieldAlert,
  SUSPENSION: Clock3,
  BAN: Ban,
};

function MultiFilter<TValue extends string>({
  label,
  values,
  options,
  labelFor,
  onChange,
}: {
  label: string;
  values: readonly TValue[];
  options: readonly TValue[];
  labelFor: (value: TValue) => string;
  onChange: (values: TValue[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = new Set(values);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`${label} filter${values.length ? `, ${values.length} selected` : ""}`}
        >
          {label}
          {values.length ? <span className="text-xs text-muted-foreground">{values.length}</span> : null}
          <ChevronDown aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <fieldset className="flex flex-col gap-1">
          <legend className="px-2 py-1 text-xs font-medium text-muted-foreground">{label}</legend>
          {options.map((option) => (
            <label
              key={option}
              className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent focus-within:bg-accent"
            >
              <Checkbox
                aria-label={labelFor(option)}
                checked={selected.has(option)}
                onCheckedChange={(checked) => {
                  const next = new Set(values);
                  if (checked === true) next.add(option);
                  else next.delete(option);
                  onChange(options.filter((value) => next.has(value)));
                }}
              />
              <span>{labelFor(option)}</span>
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}

function TypeCell({ sanction }: { sanction: AdminUserSanction }) {
  const Icon = TYPE_ICONS[sanction.type];
  return (
    <div className="flex min-w-32 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="font-medium">{ENFORCEMENT_TYPE_LABELS[sanction.type]}</span>
    </div>
  );
}

function StatusCell({ sanction }: { sanction: AdminUserSanction }) {
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

function UserCell({ sanction }: { sanction: AdminUserSanction }) {
  const label = sanction.userFullName || "Unknown user";
  if (!sanction.userId) return <span className="text-muted-foreground">{label}</span>;

  return (
    <Link
      href={`/users/${encodeURIComponent(sanction.userId)}?tab=enforcement`}
      className="font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
    </Link>
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

const ENFORCEMENT_COLUMNS: DataTableColumnDef<AdminUserSanction>[] = [
  {
    accessorKey: "type",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => <TypeCell sanction={row.original} />,
  },
  {
    accessorKey: "userFullName",
    header: "User",
    enableSorting: false,
    cell: ({ row }) => <UserCell sanction={row.original} />,
  },
  {
    accessorKey: "severity",
    header: "Severity",
    enableSorting: false,
    cell: ({ row }) => (
      <span>{row.original.severity ? ENFORCEMENT_SEVERITY_LABELS[row.original.severity] : "—"}</span>
    ),
  },
  {
    accessorKey: "active",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => <StatusCell sanction={row.original} />,
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

function errorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view enforcement records.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The enforcement service is unavailable. Check the API connection and try again.";
  }
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
    return "One or more filters are invalid. Clear the filters and try again.";
  }
  return "We could not load enforcement records right now. Please try again.";
}

function hasFilters(filters: EnforcementFilters): boolean {
  return (
    filters.type.length > 0 ||
    filters.severity.length > 0 ||
    filters.adminId !== "" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.activeOnly
  );
}

function buildQuery(filters: EnforcementFilters, pageIndex: number, pageSize: number): AdminSanctionListQuery {
  return {
    page: pageIndex,
    size: pageSize,
    ...(filters.type.length > 0 ? { type: filters.type } : {}),
    ...(filters.severity.length > 0 ? { severity: filters.severity } : {}),
    ...(filters.adminId.trim() ? { adminId: filters.adminId.trim() } : {}),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
    ...(filters.activeOnly ? { activeOnly: true } : {}),
  };
}

function FilterToolbar({
  filters,
  onFiltersChange,
  onClearAll,
}: {
  filters: EnforcementFilters;
  onFiltersChange: (value: EnforcementFilters | ((previous: EnforcementFilters) => EnforcementFilters)) => void;
  onClearAll: () => void;
}) {
  const setFilter = <TKey extends keyof EnforcementFilters>(key: TKey, value: EnforcementFilters[TKey]) => {
    onFiltersChange((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <div className="flex w-full flex-col gap-3" aria-label="Enforcement filters">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </div>
        <MultiFilter
          label="Type"
          values={filters.type}
          options={ENFORCEMENT_TYPES}
          labelFor={(value) => ENFORCEMENT_TYPE_LABELS[value]}
          onChange={(value) => setFilter("type", value)}
        />
        <MultiFilter
          label="Severity"
          values={filters.severity}
          options={ENFORCEMENT_SEVERITIES}
          labelFor={(value) => ENFORCEMENT_SEVERITY_LABELS[value]}
          onChange={(value) => setFilter("severity", value)}
        />
        <label className="flex min-w-64 flex-col gap-1 text-xs text-muted-foreground">
          <span>Issued by admin ID</span>
          <Input
            aria-label="Issued by admin ID"
            value={filters.adminId}
            placeholder="Admin UUID"
            onChange={(event) => setFilter("adminId", event.currentTarget.value)}
            className="h-8 text-xs"
          />
        </label>
        <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
          <span>From</span>
          <Input
            type="date"
            aria-label="Enforcement from"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(event) => setFilter("from", event.currentTarget.value)}
            className="h-8 px-2 text-xs"
          />
        </label>
        <label className="flex min-w-36 flex-col gap-1 text-xs text-muted-foreground">
          <span>To</span>
          <Input
            type="date"
            aria-label="Enforcement to"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => setFilter("to", event.currentTarget.value)}
            className="h-8 px-2 text-xs"
          />
        </label>
        <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm hover:bg-accent focus-within:bg-accent">
          <Checkbox
            aria-label="Active only"
            checked={filters.activeOnly}
            onCheckedChange={(checked) => setFilter("activeOnly", checked === true)}
          />
          <span>Active only</span>
        </label>
        <Button type="button" variant="ghost" size="sm" onClick={onClearAll} disabled={!hasFilters(filters)}>
          Clear filters
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Date filters use the Phnom Penh calendar day. Issued-by filtering accepts an admin UUID.
      </p>
    </div>
  );
}

/** ADM-097: global, filterable enforcement history across all users. */
export function EnforcementPage() {
  const router = useRouter();
  const tableState = useTableState<EnforcementFilters>(ENFORCEMENT_TABLE_STATE_OPTIONS);
  const [selectedSanction, setSelectedSanction] = useState<AdminUserSanction | null>(null);
  const { has } = usePermissions();
  const canLift = has("user:unban");
  const lift = useSanctionLift(selectedSanction?.userId ?? undefined);
  const query = useMemo(
    () => buildQuery(tableState.filters, tableState.pageIndex, tableState.pageSize),
    [tableState.filters, tableState.pageIndex, tableState.pageSize],
  );
  const sanctionsQuery = useAdminSanctions(query);
  const sanctions = sanctionsQuery.data?.content ?? [];
  const filtersActive = hasFilters(tableState.filters);

  const openUserDetails = useCallback(
    (userId: string) => {
      router.push(`/users/${encodeURIComponent(userId)}?tab=enforcement`);
    },
    [router],
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">
        {sanctionsQuery.isFetching ? "Updating enforcement records..." : "Enforcement records up to date."}
      </div>

      <PageHeader
        title="Enforcement"
        description="Review warnings, suspensions, and bans across all GenLink KH accounts."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void sanctionsQuery.refetch()}
            disabled={sanctionsQuery.isFetching}
            aria-label="Refresh enforcement records"
          >
            <RefreshCw
              className={`mr-1.5 size-3.5 ${sanctionsQuery.isFetching ? "motion-safe:animate-spin" : ""} motion-reduce:animate-none`}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <DataTable
        data={sanctions}
        columns={ENFORCEMENT_COLUMNS}
        getRowId={(sanction) => sanction.sanctionId}
        ariaLabel="Global enforcement records"
        caption="Warnings, suspensions, and bans across all users"
        toolbar={
          <FilterToolbar
            filters={tableState.filters}
            onFiltersChange={tableState.setFilters}
            onClearAll={tableState.reset}
          />
        }
        pagination={{
          pageIndex: tableState.pageIndex,
          pageSize: tableState.pageSize,
          pageSizeOptions: [...PAGE_SIZE_OPTIONS],
          totalRows: sanctionsQuery.data?.totalElements ?? 0,
          onPageIndexChange: tableState.setPageIndex,
          onPageSizeChange: tableState.setPageSize,
        }}
        onRowClick={(sanction) => {
          if (sanction.userId) openUserDetails(sanction.userId);
        }}
        rowAriaLabel={(sanction) =>
          sanction.userId
            ? `Open enforcement history for ${sanction.userFullName || "user"}`
            : "Enforcement record without a user link"
        }
        rowActions={(sanction) =>
          canLift && sanction.active ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-data-table-interactive
              aria-label={`Lift ${ENFORCEMENT_TYPE_LABELS[sanction.type].toLowerCase()} for ${sanction.userFullName || "user"}`}
              onClick={() => setSelectedSanction(sanction)}
              disabled={lift.pending}
            >
              {lift.pending && lift.pendingSanctionId === sanction.sanctionId ? "Lifting…" : "Lift"}
            </Button>
          ) : (
            <span className="px-2 text-xs text-muted-foreground" aria-label="No action available">
              —
            </span>
          )
        }
        loading={sanctionsQuery.isLoading}
        loadingRowCount={8}
        error={sanctionsQuery.isError ? errorDescription(sanctionsQuery.error) : null}
        onRetry={() => void sanctionsQuery.refetch()}
        emptyState={{
          title: filtersActive ? "No matching enforcement records" : "No enforcement records",
          description: filtersActive
            ? "Try clearing one or more filters."
            : "No warnings, suspensions, or bans are recorded yet.",
          onClearFilters: tableState.reset,
          clearFiltersLabel: "Clear filters",
        }}
        stickyHeader
        columnVisibilityStorageKey="genlink-admin-enforcement-columns"
        densityStorageKey="genlink-admin-enforcement-density"
        className="min-w-0"
      />

      <UserSanctionLiftDialog
        sanction={selectedSanction}
        pending={lift.pending}
        onOpenChange={(open) => {
          if (!open) setSelectedSanction(null);
        }}
        onConfirm={(sanctionId, reason) => lift.execute({ sanctionId, reason })}
      />
    </div>
  );
}
