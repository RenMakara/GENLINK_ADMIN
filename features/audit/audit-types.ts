import type { TableFilterCodecs } from "@/hooks/use-table-state";
import { tableFilterCodecs } from "@/hooks/use-table-state";

export const AUDIT_STATUSES = ["SUCCESS", "FAILURE"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

/** JSON values returned by the backend's structured audit snapshots. */
export type AuditJsonValue =
  | null
  | boolean
  | number
  | string
  | AuditJsonValue[]
  | { [key: string]: AuditJsonValue };

export interface AuditLogSummary {
  auditLogId: string;
  createdAt: string;
  adminUserId: string | null;
  adminName: string | null;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  status: AuditStatus;
  errorCode: string | null;
  reason: string | null;
  requestId: string | null;
  batchId: string | null;
}

export interface AuditLogDetail extends AuditLogSummary {
  beforeJson: AuditJsonValue | null;
  afterJson: AuditJsonValue | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLogFilters {
  adminId: string;
  action: string;
  targetType: string;
  from: string;
  to: string;
  status: AuditStatus | "";
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function calendarDateCodec() {
  return {
    defaultValue: "",
    parse: (values: readonly string[]) => {
      const value = values.at(-1) ?? "";
      return value === "" || isCalendarDate(value) ? value : undefined;
    },
    serialize: (value: string) => (isCalendarDate(value) ? [value] : []),
  };
}

export const AUDIT_LOG_FILTER_CODECS: TableFilterCodecs<AuditLogFilters> = {
  adminId: tableFilterCodecs.string(),
  action: tableFilterCodecs.string(),
  targetType: tableFilterCodecs.string(),
  from: calendarDateCodec(),
  to: calendarDateCodec(),
  status: tableFilterCodecs.enum(AUDIT_STATUSES, ""),
};

export function createDefaultAuditLogFilters(): AuditLogFilters {
  return {
    adminId: "",
    action: "",
    targetType: "",
    from: "",
    to: "",
    status: "",
  };
}

