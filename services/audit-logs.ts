import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { TableState } from "@/hooks/use-table-state";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PageResponse } from "@/lib/api/types";

import { AUDIT_LOG_FILTER_CODECS, type AuditLogDetail, type AuditLogFilters, type AuditStatus } from "@/features/audit/audit-types";

import { queryKeys } from "./query-keys";

export type AuditLogTableState = Pick<
  TableState<AuditLogFilters>,
  "filters" | "pageIndex" | "pageSize"
>;

export type AuditLogListQuery = Record<string, unknown> & {
  page: number;
  size: number;
  adminId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  status?: AuditStatus;
};

export interface AuditLogExportRequest {
  adminId?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  status?: AuditStatus;
  reason: string;
}

function serializeAuditFilter(key: keyof AuditLogFilters, value: unknown): readonly string[] {
  return (AUDIT_LOG_FILTER_CODECS[key] as { serialize: (input: unknown) => readonly string[] }).serialize(value);
}

/** Converts URL-owned filters to the exact ADM-116 list query. */
export function buildAuditLogListQuery(state: AuditLogTableState): AuditLogListQuery {
  const query: AuditLogListQuery = {
    page: state.pageIndex,
    size: state.pageSize,
  };

  for (const key of Object.keys(AUDIT_LOG_FILTER_CODECS) as Array<keyof AuditLogFilters>) {
    const values = serializeAuditFilter(key, state.filters[key]);
    if (values.length > 0) Object.assign(query, { [key]: values[0] });
  }

  return query;
}

/** Exports the complete filtered audit result; pagination is intentionally omitted. */
export function buildAuditLogExportRequest(
  filters: AuditLogFilters,
  reason: string,
): AuditLogExportRequest {
  const request: AuditLogExportRequest = { reason };
  for (const key of Object.keys(AUDIT_LOG_FILTER_CODECS) as Array<keyof AuditLogFilters>) {
    const values = serializeAuditFilter(key, filters[key]);
    if (values.length > 0) Object.assign(request, { [key]: values[0] });
  }
  return request;
}

export function useAuditLogList(query: AuditLogListQuery, enabled = true) {
  return useQuery<PageResponse<import("@/features/audit/audit-types").AuditLogSummary>>({
    queryKey: queryKeys.auditLogs.list(query),
    queryFn: ({ signal }) =>
      api.get<PageResponse<import("@/features/audit/audit-types").AuditLogSummary>>(
        endpoints.auditLogs.list,
        { query, signal },
      ),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAuditLogDetail(auditLogId: string | null, enabled = true) {
  return useQuery<AuditLogDetail>({
    queryKey: queryKeys.auditLogs.detail(auditLogId ?? ""),
    queryFn: ({ signal }) =>
      api.get<AuditLogDetail>(endpoints.auditLogs.detail(auditLogId as string), { signal }),
    enabled: enabled && Boolean(auditLogId),
  });
}

/** Requests the audited Super Admin CSV stream for the current filtered audit view. */
export function exportAuditLogsCsv(request: AuditLogExportRequest) {
  return api.downloadPost(endpoints.auditLogs.export, request, { accept: "text/csv" });
}
