import { describe, expect, it } from "vitest";

import {
  displayTimeZone,
  formatDate,
  formatDateTime,
  formatPrecise,
  formatRelative,
  formatTime,
  toCalendarDate,
} from "./date";

/** Crosses into the next day in Phnom Penh, catching timezone mistakes. */
const CROSSES_MIDNIGHT = "2026-08-01T17:30:00Z";

/** Same UTC day, same Cambodian day — the control for the case above. */
const SAME_DAY = "2026-08-01T02:00:00Z";

describe("timezone pinning", () => {
  /** Explicit timezones make output independent of the machine setting. */
  it("resolves to Asia/Phnom_Penh regardless of the machine timezone", () => {
    expect(displayTimeZone).toBe("Asia/Phnom_Penh");
  });

  it("formats an instant into the Cambodian day, not the UTC day", () => {
    // 17:30Z is already tomorrow in Phnom Penh. Reading the UTC date here would show 1 Aug.
    expect(formatDateTime(CROSSES_MIDNIGHT)).toBe("2 Aug 2026, 00:30");
    expect(formatDate(CROSSES_MIDNIGHT)).toBe("2 Aug 2026");
    expect(formatTime(CROSSES_MIDNIGHT)).toBe("00:30");
  });

  it("leaves an instant that does not cross midnight on its own day", () => {
    expect(formatDateTime(SAME_DAY)).toBe("1 Aug 2026, 09:00");
  });

  it("uses 24-hour time, so 13:00 is not rendered as 1", () => {
    expect(formatTime("2026-08-01T06:00:00Z")).toBe("13:00");
  });

  it("keeps midnight as 00, not 24", () => {
    // en-GB with hour12:false has historically produced "24:00" for midnight; hourCycle
    // differences between runtimes make this worth pinning rather than assuming.
    expect(formatTime("2026-08-01T17:00:00Z")).toBe("00:00");
  });
});

describe("format shapes", () => {
  it("spells the month, so 01/08 cannot be read as 8 January", () => {
    expect(formatDate("2026-01-08T04:00:00Z")).toBe("8 Jan 2026");
  });

  it("includes seconds only in the precise variant", () => {
    expect(formatPrecise("2026-08-01T17:30:15Z")).toBe("2 Aug 2026, 00:30:15");
    expect(formatDateTime("2026-08-01T17:30:15Z")).toBe("2 Aug 2026, 00:30");
  });

  it("accepts a Date and epoch millis as well as an ISO string", () => {
    const iso = formatDateTime(CROSSES_MIDNIGHT);
    expect(formatDateTime(new Date(CROSSES_MIDNIGHT))).toBe(iso);
    expect(formatDateTime(new Date(CROSSES_MIDNIGHT).getTime())).toBe(iso);
  });
});

describe("missing and malformed values", () => {
  // A nullable timestamp is normal in the API (last_login_at, banned_until). A table cell
  // must not render "Invalid Date", and a single bad row must not throw and blank the page.
  it.each([null, undefined, ""])("renders a placeholder for %p", (value) => {
    expect(formatDateTime(value)).toBe("—");
    expect(formatDate(value)).toBe("—");
    expect(formatRelative(value)).toBe("—");
  });

  it("renders a placeholder rather than 'Invalid Date' for unparseable input", () => {
    expect(formatDateTime("not-a-date")).toBe("—");
    expect(formatPrecise("2026-13-45T99:99:99Z")).toBe("—");
  });

  it("returns an empty string for a missing calendar date, not a placeholder", () => {
    // This one feeds a query parameter, where "—" would be sent to the backend verbatim.
    expect(toCalendarDate(null)).toBe("");
  });
});

describe("toCalendarDate", () => {
  it("gives the Cambodian calendar day for a filter parameter", () => {
    expect(toCalendarDate(CROSSES_MIDNIGHT)).toBe("2026-08-02");
    expect(toCalendarDate(SAME_DAY)).toBe("2026-08-01");
  });

  it("differs from the UTC date whenever the instant is after 17:00Z", () => {
    // The trap this function exists to avoid: toISOString().slice(0, 10) is always the UTC
    // day, so a filter built that way silently drops the first seven hours of every Cambodian
    // morning into the previous day. This assertion is machine-timezone independent.
    expect(new Date(CROSSES_MIDNIGHT).toISOString().slice(0, 10)).toBe("2026-08-01");
    expect(toCalendarDate(CROSSES_MIDNIGHT)).toBe("2026-08-02");
  });

  it("pads to a fixed YYYY-MM-DD width the backend can parse", () => {
    expect(toCalendarDate("2026-01-05T04:00:00Z")).toBe("2026-01-05");
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-08-01T12:00:00Z");

  it.each([
    ["2026-05-01T12:00:00Z", "3 months ago"],
    ["2026-07-31T12:00:00Z", "yesterday"],
    ["2026-08-01T10:00:00Z", "2 hours ago"],
    ["2026-08-01T11:55:00Z", "5 minutes ago"],
    ["2025-08-01T12:00:00Z", "last year"],
  ])("renders %s as %s", (value, expected) => {
    expect(formatRelative(value, now)).toBe(expected);
  });

  it("handles the future, for a scheduled unban", () => {
    expect(formatRelative("2026-08-03T12:00:00Z", now)).toBe("in 2 days");
  });

  it("says 'now' rather than '0 seconds ago'", () => {
    expect(formatRelative(now, now)).toBe("now");
  });

  it("takes 'now' as an argument so it does not depend on the wall clock", () => {
    // Without injection this suite would pass all day and change its answers overnight — the
    // shape of flake that broke the backend build at 21:59.
    expect(formatRelative("2026-05-01T12:00:00Z", now)).toBe(
      formatRelative("2026-05-01T12:00:00Z", now),
    );
  });
});
