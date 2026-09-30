import { env } from "@/lib/config/env";

/** Formats UTC timestamps in Asia/Phnom_Penh with explicit timezones. */

const TIME_ZONE = env.NEXT_PUBLIC_TIMEZONE;

/** Day-first, unambiguous date format for admin screens. */
const LOCALE = "en-GB";

/** Shown when a value is missing or unparseable, rather than "Invalid Date" in a table cell. */
const EMPTY = "—";

/** Reuses formatter instances across table cells. */
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(key: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: TIME_ZONE });
    formatters.set(key, cached);
  }
  return cached;
}

/** Accepts what the API returns (ISO-8601 UTC), plus Date and epoch millis. */
export type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  // An unparseable string yields an Invalid Date, whose getTime() is NaN. Caught here so a
  // single bad row cannot render "Invalid Date" across a table.
  return Number.isNaN(date.getTime()) ? null : date;
}

/** `2 Aug 2026, 00:30` — the default for anything with a time component. */
export function formatDateTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return formatter("dateTime", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    // 24-hour: an ops tool should not make anyone parse am/pm to compare two timestamps.
    hour12: false,
  }).format(date);
}

/** `2 Aug 2026` — for values where the time is noise. */
export function formatDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return formatter("date", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/** `00:30` */
export function formatTime(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return formatter("time", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

/** `2 Aug 2026, 00:30:15` — for audit rows and login history, where the second matters. */
export function formatPrecise(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY;
  return formatter("precise", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/** Returns the Cambodia-local calendar day for an instant. */
export function toCalendarDate(value: DateInput): string {
  const date = toDate(value);
  if (!date) return "";
  // `en-CA` renders ISO-style `2026-08-02`, with the timezone still applied.
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
  return parts;
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

const relativeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

/** Client-only relative time avoids SSR mismatches; `now` keeps tests deterministic. */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return EMPTY;

  const diff = date.getTime() - now.getTime();
  const magnitude = Math.abs(diff);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (magnitude >= ms) {
      return relativeFormatter.format(Math.round(diff / ms), unit);
    }
  }
  return relativeFormatter.format(Math.round(diff / 1000), "second");
}

/** The timezone every formatter here uses. Exposed so a UI can say which zone it is showing. */
export const displayTimeZone = TIME_ZONE;
