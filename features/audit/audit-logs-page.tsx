"use client";

import Link from "next/link";
import { CheckCircle2, CircleX, RefreshCw, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { DataTable, type DataTableColumnDef } from "@/components/data-table";
import { ErrorState, PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import { usePermissions } from "@/hooks/use-permission";
import { useTableState, type UseTableStateOptions } from "@/hooks/use-table-state";
import { ApiError } from "@/lib/api/errors";
import { formatPrecise } from "@/lib/utils/date";
import { buildAuditLogListQuery, useAuditLogList } from "@/services/audit-logs";

import { AuditDetailSheet } from "./audit-detail-sheet";
import { AuditExportButton } from "./audit-export";
import {
  AUDIT_LOG_FILTER_CODECS,
  AUDIT_STATUSES,
  type AuditLogFilters,
  type AuditLogSummary,
  type AuditStatus,
} from "./audit-types";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const AUDIT_TABLE_STATE_OPTIONS: UseTableStateOptions<AuditLogFilters> = {
  filterCodecs: AUDIT_LOG_FILTER_CODECS,
  defaultPageSize: PAGE_SIZE_OPTIONS[0],
  pageSizeOptions: PAGE_SIZE_OPTIONS,
  history: "replace",
};

function errorDescription(error: unknown): string {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
    return "You do not have permission to view the audit trail.";
  }
  if (error instanceof ApiError && error.status === 0) {
    return "The audit service is unavailable. Check the API connection and try again.";
  }
  if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
    return "One or more filters are invalid. Clear the filters and try again.";
  }
  return "We could not load audit logs right now. Please try again.";
}

function hasFilters(filters: AuditLogFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function FilterField({ label, children, className = "min-w-40" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`flex ${className} flex-col gap-1 text-xs text-muted-foreground`}><span>{label}</span>{children}</label>;
}

function FilterToolbar({
  filters,
  onFilter,
  onClear,
}: {
  filters: AuditLogFilters;
  onFilter: <TKey extends keyof AuditLogFilters>(key: TKey, value: AuditLogFilters[TKey]) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3" aria-label="Audit log filters">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex items-center gap-2 self-center text-sm font-medium text-foreground">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </div>
        <FilterField label="Admin ID" className="min-w-56">
          <Input aria-label="Audit admin ID" placeholder="Admin UUID" value={filters.adminId} onChange={(event) => onFilter("adminId", event.currentTarget.value)} />
        </FilterField>
        <FilterField label="Action" className="min-w-44">
          <Input aria-label="Audit action" placeholder="USER_BAN" value={filters.action} onChange={(event) => onFilter("action", event.currentTarget.value)} />
        </FilterField>
        <FilterField label="Target type" className="min-w-36">
          <Input aria-label="Audit target type" placeholder="USER" value={filters.targetType} onChange={(event) => onFilter("targetType", event.currentTarget.value)} />
        </FilterField>
        <FilterField label="From">
          <Input type="date" aria-label="Audit from" value={filters.from} max={filters.to || undefined} onChange={(event) => onFilter("from", event.currentTarget.value)} />
        </FilterField>
        <FilterField label="To">
          <Input type="date" aria-label="Audit to" value={filters.to} min={filters.from || undefined} onChange={(event) => onFilter("to", event.currentTarget.value)} />
        </FilterField>
        <FilterField label="Status" className="min-w-32">
          <select aria-label="Audit status" value={filters.status} onChange={(event) => onFilter("status", event.currentTarget.value as AuditStatus | "")} className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30">
            <option value="">All statuses</option>
            {AUDIT_STATUSES.map((status) => <option key={status} value={status}>{status === "SUCCESS" ? "Success" : "Failure"}</option>)}
          </select>
        </FilterField>
        <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!hasFilters(filters)}>Clear filters</Button>
      </div>
      <p className="text-xs text-muted-foreground">Dates use Phnom Penh calendar days. Scoped roles see only the audit actions permitted by the server.</p>
    </div>
  );
}

function AdminCell({ log }: { log: AuditLogSummary }) {
  return <div className="min-w-40"><p className="font-medium">{log.adminName || "System"}</p>{log.adminEmail ? <p className="text-xs text-muted-foreground">{log.adminEmail}</p> : null}</div>;
}

function TargetCell({ log }: { log: AuditLogSummary }) {
  if (!log.targetId) return <span className="text-muted-foreground">{log.targetType || "—"}</span>;
  if (log.targetType?.toUpperCase() === "USER") {
    return <Link href={`/users/${encodeURIComponent(log.targetId)}`} className="font-mono text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{log.targetType} · {log.targetId}</Link>;
  }
  return <span className="font-mono text-xs">{log.targetType || "Target"} · {log.targetId}</span>;
}

function StatusCell({ status }: { status: AuditStatus }) {
  const success = status === "SUCCESS";
  return <Badge variant={success ? "secondary" : "destructive"}>{success ? <CheckCircle2 aria-hidden="true" /> : <CircleX aria-hidden="true" />}{success ? "Success" : "Failure"}</Badge>;
}

function DateCell({ value }: { value: string }) {
  const formatted = formatPrecise(value);
  return <time dateTime={value} title={formatted} className="whitespace-nowrap text-muted-foreground">{formatted}</time>;
}

const AUDIT_COLUMNS: DataTableColumnDef<AuditLogSummary>[] = [
  { accessorKey: "createdAt", header: "When", enableSorting: false, cell: ({ row }) => <DateCell value={row.original.createdAt} /> },
  { accessorKey: "adminName", header: "Admin", enableSorting: false, cell: ({ row }) => <AdminCell log={row.original} /> },
  { accessorKey: "action", header: "Action", enableSorting: false, cell: ({ row }) => <Badge variant="outline">{row.original.action}</Badge> },
  { accessorKey: "targetType", header: "Target", enableSorting: false, cell: ({ row }) => <TargetCell log={row.original} /> },
  { accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => <StatusCell status={row.original.status} /> },
  { accessorKey: "reason", header: "Reason", enableSorting: false, cell: ({ row }) => <span className="block min-w-48 max-w-md whitespace-normal">{row.original.reason || <span className="text-muted-foreground">No reason recorded</span>}</span> },
];

/** ADM-120: filterable, read-only audit trail with target links and a diff drawer. */
export function AuditLogsPage() {
  const currentAdmin = useCurrentAdmin();
  const { has, ready } = usePermissions();
  const tableState = useTableState<AuditLogFilters>(AUDIT_TABLE_STATE_OPTIONS);
  const [selectedAuditLogId, setSelectedAuditLogId] = useState<string | null>(null);
  const canRead = ready && has("audit:read");
  const canExport = canRead && currentAdmin?.roleCode === "SUPER_ADMIN";
  const query = useMemo(() => buildAuditLogListQuery(tableState), [tableState]);
  const logsQuery = useAuditLogList(query, canRead);
  const logs = logsQuery.data?.content ?? [];

  if (!ready) {
    return <div className="flex min-h-48 items-center justify-center text-sm text-muted-foreground" role="status">Loading audit access…</div>;
  }

  if (!canRead) {
    return <div className="flex w-full flex-col gap-6"><PageHeader title="Audit logs" description="Review the append-only administrative audit trail." /><ErrorState title="Access restricted" description="You do not have permission to view the audit trail." /></div>;
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="sr-only" aria-live="polite" role="status">{logsQuery.isFetching ? "Updating audit logs…" : "Audit logs up to date."}</div>
      <PageHeader
        title="Audit logs"
        description="Review privileged administrative actions. Records are read-only and cannot be deleted."
        actions={<div className="flex flex-wrap items-center gap-2">{canExport ? <AuditExportButton filters={tableState.filters} /> : null}<Button type="button" variant="outline" size="sm" onClick={() => void logsQuery.refetch()} disabled={logsQuery.isFetching} aria-label="Refresh audit logs"><RefreshCw className={`mr-1.5 size-3.5 ${logsQuery.isFetching ? "motion-safe:animate-spin" : ""} motion-reduce:animate-none`} aria-hidden="true" />Refresh</Button></div>}
      />
      <DataTable
        data={logs}
        columns={AUDIT_COLUMNS}
        getRowId={(log) => log.auditLogId}
        ariaLabel="Audit logs"
        caption="Append-only administrative audit trail"
        toolbar={<FilterToolbar filters={tableState.filters} onFilter={tableState.setFilter} onClear={tableState.reset} />}
        pagination={{ pageIndex: tableState.pageIndex, pageSize: tableState.pageSize, pageSizeOptions: [...PAGE_SIZE_OPTIONS], totalRows: logsQuery.data?.totalElements ?? 0, onPageIndexChange: tableState.setPageIndex, onPageSizeChange: tableState.setPageSize }}
        onRowClick={(log) => setSelectedAuditLogId(log.auditLogId)}
        rowAriaLabel={(log) => `Open audit detail for ${log.action} at ${formatPrecise(log.createdAt)}`}
        loading={logsQuery.isLoading}
        loadingRowCount={8}
        error={logsQuery.isError ? errorDescription(logsQuery.error) : null}
        onRetry={() => void logsQuery.refetch()}
        emptyState={{ title: hasFilters(tableState.filters) ? "No matching audit logs" : "No audit logs", description: hasFilters(tableState.filters) ? "Try clearing one or more filters." : "No privileged actions are recorded yet.", onClearFilters: tableState.reset, clearFiltersLabel: "Clear filters" }}
        stickyHeader
        columnVisibilityStorageKey="genlink-admin-audit-columns"
        densityStorageKey="genlink-admin-audit-density"
        className="min-w-0"
      />
      <AuditDetailSheet auditLogId={selectedAuditLogId} onOpenChange={(open) => { if (!open) setSelectedAuditLogId(null); }} />
    </div>
  );
}

