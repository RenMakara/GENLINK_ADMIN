import { env } from "@/lib/config/env";

/**
 * The only place a timestamp becomes a string.
 *
 * <p>Project strategy (SSOT §9.5): the database stores and the API transmits **UTC**;
 * everything displayed is **Asia/Phnom_Penh**. Every formatter here passes an explicit
 * `timeZone`, so output does not depend on the machine or browser it runs on.
 *
 * <h2>Why this is centralised</h2>
 *
 * `date.toLocaleString()` uses the *viewer's* timezone. An admin travelling would see
 * different day boundaries from a colleague in Phnom Penh, and two people comparing the same
 * dashboard on a call would disagree about which day a signup landed on.
 *
 * <p>The failure is invisible where it is most likely to be reviewed: on a machine set to
 * Cambodian time, `toLocaleString()` and this module produce identical output. An ESLint rule
 * therefore rejects `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString` outside
 * this file — the mistake cannot be caught by reading the diff.
 *
 * <p>These use `Intl.DateTimeFormat(...).format()` rather than the `toLocale*` methods, so the
 * module needs no exemption from its own rule.
 */

const TIME_ZONE = env.NEXT_PUBLIC_TIMEZONE;

/**
 * `en-GB` for day-first ordering — `2 Aug 2026`, never `Aug 2, 2026`.
 *
 * <p>Fixed rather than following the viewer's locale: `01/08/2026` reads as 1 August to most
 * of the team and 8 January to a US-configured browser, and a date that is silently wrong by
 * seven months is worse than one that looks foreign. The month is spelled to remove the
 * ambiguity entirely.
 */
const LOCALE = "en-GB";

/** Shown when a value is missing or unparseable, rather than "Invalid Date" in a table cell. */
const EMPTY = "—";

/**
 * `Intl.DateTimeFormat` construction is expensive, and a data table renders it per cell — 25
 * rows across three date columns is 75 constructions per paint. Built once, reused.
 */
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

/**
 * The Cambodian calendar day an instant falls on, as `YYYY-MM-DD`.
 *
 * <p>This is what date-range filters send to the backend, which converts it to UTC instants at
 * the request boundary (SSOT §9.5). Deriving it from the formatter rather than from
 * `toISOString().slice(0, 10)` matters: the latter gives the *UTC* day, which is the previous
 * date for the first seven hours of every Cambodian morning.
 */
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

/**
 * `3 months ago`, `in 2 days`, `yesterday`.
 *
 * <p><strong>Client-only.</strong> The result depends on "now", so a Server Component would
 * render one value and hydration would produce another — React reports that as a mismatch,
 * and it is a real one. Render it after mount, or pair it with an absolute value as SSOT §4.1
 * describes: relative in the cell, exact on hover.
 *
 * @param now injectable so tests do not depend on the wall clock — the flake that took down
 *     the backend's productivity test every evening.
 */
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
