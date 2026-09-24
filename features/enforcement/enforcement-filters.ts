import type { TableFilterCodec, TableFilterCodecs } from "@/hooks/use-table-state";
import { tableFilterCodecs } from "@/hooks/use-table-state";

export const ENFORCEMENT_TYPES = ["WARNING", "SUSPENSION", "BAN"] as const;
export const ENFORCEMENT_SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type EnforcementType = (typeof ENFORCEMENT_TYPES)[number];
export type EnforcementSeverity = (typeof ENFORCEMENT_SEVERITIES)[number];

export interface EnforcementFilters {
  type: EnforcementType[];
  severity: EnforcementSeverity[];
  adminId: string;
  from: string;
  to: string;
  activeOnly: boolean;
}

function enumArrayCodec<const TValue extends string>(
  allowedValues: readonly TValue[],
): TableFilterCodec<TValue[]> {
  const allowed = new Set(allowedValues);

  return {
    defaultValue: [],
    parse: (values) =>
      Array.from(
        new Set(
          values
            .flatMap((value) => value.split(","))
            .filter((value): value is TValue => allowed.has(value as TValue)),
        ),
      ),
    serialize: (value) => Array.from(new Set(value.filter((item) => allowed.has(item)))),
  };
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

function calendarDateCodec(): TableFilterCodec<string> {
  return {
    defaultValue: "",
    parse: (values) => {
      const value = values.at(-1) ?? "";
      return value === "" || isCalendarDate(value) ? value : undefined;
    },
    serialize: (value) => (isCalendarDate(value) ? [value] : []),
  };
}

export const ENFORCEMENT_FILTER_CODECS: TableFilterCodecs<EnforcementFilters> = {
  type: enumArrayCodec(ENFORCEMENT_TYPES),
  severity: enumArrayCodec(ENFORCEMENT_SEVERITIES),
  adminId: tableFilterCodecs.string(),
  from: calendarDateCodec(),
  to: calendarDateCodec(),
  activeOnly: tableFilterCodecs.boolean(),
};

export function createDefaultEnforcementFilters(): EnforcementFilters {
  return {
    type: [],
    severity: [],
    adminId: "",
    from: "",
    to: "",
    activeOnly: false,
  };
}

export const ENFORCEMENT_TYPE_LABELS: Record<EnforcementType, string> = {
  WARNING: "Warning",
  SUSPENSION: "Suspension",
  BAN: "Ban",
};

export const ENFORCEMENT_SEVERITY_LABELS: Record<EnforcementSeverity, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
