import { toCalendarDate } from "@/lib/utils/date";

export const ANALYTICS_RANGE_PRESETS = ["7d", "30d", "90d", "12m", "custom"] as const;
export type AnalyticsRangePreset = (typeof ANALYTICS_RANGE_PRESETS)[number];

export const ANALYTICS_GRANULARITIES = ["day", "week", "month"] as const;
export type AnalyticsGranularity = (typeof ANALYTICS_GRANULARITIES)[number];

export const ANALYTICS_TABS = [
  { value: "overview", label: "Overview" },
  { value: "audience", label: "Audience" },
  { value: "engagement", label: "Engagement & platform" },
] as const;
export type AnalyticsTab = (typeof ANALYTICS_TABS)[number]["value"];

export const DEFAULT_ANALYTICS_RANGE = "30d" as const;
export const DEFAULT_ANALYTICS_GRANULARITY = "day" as const satisfies AnalyticsGranularity;
export const DEFAULT_ANALYTICS_TAB = "overview" as const satisfies AnalyticsTab;

export interface AnalyticsState {
  range: AnalyticsRangePreset;
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
  tab: AnalyticsTab;
}

export interface ParsedAnalyticsState extends AnalyticsState {
  customRangeError: string | null;
}

export interface AnalyticsQuery {
  from: string;
  to: string;
  granularity: AnalyticsGranularity;
}

/**
 * Dashboard identifiers are the stable contract used by ADM-118 query keys. Keeping them here
 * means every future chart can use the same URL-derived range without inventing its own state.
 */
export const ANALYTICS_DASHBOARDS = [
  { id: "user-growth", label: "User growth", tab: "overview" },
  { id: "active-users", label: "Daily & monthly active users", tab: "overview" },
  { id: "registrations", label: "Registration trend", tab: "overview" },
  { id: "user-status", label: "User status", tab: "audience" },
  { id: "universities", label: "University statistics", tab: "audience" },
  { id: "work-status", label: "Work status distribution", tab: "audience" },
  { id: "languages", label: "Language usage", tab: "audience" },
  { id: "xp-distribution", label: "XP distribution", tab: "engagement" },
  { id: "platforms", label: "Platform usage", tab: "engagement" },
] as const satisfies ReadonlyArray<{
  id: string;
  label: string;
  tab: AnalyticsTab;
}>;

export type AnalyticsDashboardId = (typeof ANALYTICS_DASHBOARDS)[number]["id"];

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isAnalyticsRangePreset(value: string | null): value is AnalyticsRangePreset {
  return value !== null && (ANALYTICS_RANGE_PRESETS as readonly string[]).includes(value);
}

function isAnalyticsGranularity(value: string | null): value is AnalyticsGranularity {
  return value !== null && (ANALYTICS_GRANULARITIES as readonly string[]).includes(value);
}

export function isAnalyticsTab(value: string | null): value is AnalyticsTab {
  return ANALYTICS_TABS.some((tab) => tab.value === value);
}

/** Validate a date input without allowing JavaScript's date overflow normalisation. */
export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return false;

  const [year, month, day] = value.split("-").map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function shiftCalendarDate(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);

  return [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
}

export function presetAnalyticsRange(
  preset: Exclude<AnalyticsRangePreset, "custom">,
  today: string,
): Pick<AnalyticsState, "from" | "to"> {
  const daysBack: Record<Exclude<AnalyticsRangePreset, "custom">, number> = {
    "7d": 6,
    "30d": 29,
    "90d": 89,
    "12m": 364,
  };

  if (!isCalendarDate(today)) {
    throw new Error(`Invalid analytics reference date: ${today}`);
  }

  return { from: shiftCalendarDate(today, -daysBack[preset]), to: today };
}

export function createDefaultAnalyticsState(now: Date = new Date()): ParsedAnalyticsState {
  const today = toCalendarDate(now);
  const range = presetAnalyticsRange(DEFAULT_ANALYTICS_RANGE, today);

  return {
    range: DEFAULT_ANALYTICS_RANGE,
    ...range,
    granularity: DEFAULT_ANALYTICS_GRANULARITY,
    tab: DEFAULT_ANALYTICS_TAB,
    customRangeError: null,
  };
}

function customRangeError(from: string, to: string): string | null {
  if (!isCalendarDate(from) || !isCalendarDate(to)) {
    return "Choose a valid start and end date.";
  }
  if (from > to) return "The start date must be on or before the end date.";
  return null;
}

export function analyticsQuery(state: ParsedAnalyticsState | AnalyticsState): AnalyticsQuery | null {
  const error = "customRangeError" in state ? state.customRangeError : customRangeError(state.from, state.to);
  if (error) return null;

  return {
    from: state.from,
    to: state.to,
    granularity: state.granularity,
  };
}

/** Parse only the analytics-owned parameters and leave unrelated page parameters untouched. */
export function parseAnalyticsState(
  params: URLSearchParams,
  now: Date = new Date(),
): ParsedAnalyticsState {
  const defaults = createDefaultAnalyticsState(now);
  const range = isAnalyticsRangePreset(params.get("range"))
    ? (params.get("range") as AnalyticsRangePreset)
    : defaults.range;
  const granularity = isAnalyticsGranularity(params.get("granularity"))
    ? (params.get("granularity") as AnalyticsGranularity)
    : defaults.granularity;
  const tab = isAnalyticsTab(params.get("tab"))
    ? (params.get("tab") as AnalyticsTab)
    : defaults.tab;

  if (range !== "custom") {
    return {
      range,
      ...presetAnalyticsRange(range, toCalendarDate(now)),
      granularity,
      tab,
      customRangeError: null,
    };
  }

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  return {
    range,
    from,
    to,
    granularity,
    tab,
    customRangeError: customRangeError(from, to),
  };
}

/**
 * Merge the analytics state into an existing query string. Other feature-owned parameters are
 * preserved so a future deep link can combine analytics state with shared page context.
 */
export function serializeAnalyticsState(state: AnalyticsState, currentSearch = ""): string {
  const params = new URLSearchParams(currentSearch);
  ["range", "from", "to", "granularity", "tab"].forEach((key) => params.delete(key));

  if (state.range !== DEFAULT_ANALYTICS_RANGE) params.set("range", state.range);
  if (state.range === "custom") {
    if (state.from) params.set("from", state.from);
    if (state.to) params.set("to", state.to);
  }
  if (state.granularity !== DEFAULT_ANALYTICS_GRANULARITY) {
    params.set("granularity", state.granularity);
  }
  if (state.tab !== DEFAULT_ANALYTICS_TAB) params.set("tab", state.tab);

  return params.toString();
}

/**
 * React Query key contract for ADM-118. A changed range or granularity creates a new key, so
 * every visible chart using this helper will refetch rather than display a previous range.
 */
export function analyticsQueryKey(dashboard: AnalyticsDashboardId, query: AnalyticsQuery) {
  return ["admin", "analytics", dashboard, query.from, query.to, query.granularity] as const;
}

export function dashboardsForTab(tab: AnalyticsTab) {
  return ANALYTICS_DASHBOARDS.filter((dashboard) => dashboard.tab === tab);
}
