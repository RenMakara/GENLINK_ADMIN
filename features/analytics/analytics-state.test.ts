import { describe, expect, it } from "vitest";

import {
  analyticsQuery,
  analyticsQueryKey,
  dashboardsForTab,
  parseAnalyticsState,
  presetAnalyticsRange,
  serializeAnalyticsState,
} from "./analytics-state";

const REFERENCE_NOW = new Date("2026-09-25T04:00:00.000Z");

describe("analytics URL state (ADM-117)", () => {
  it("derives preset ranges as Phnom Penh calendar dates", () => {
    expect(presetAnalyticsRange("7d", "2026-09-25")).toEqual({
      from: "2026-09-19",
      to: "2026-09-25",
    });
    expect(parseAnalyticsState(new URLSearchParams("range=90d&granularity=week"), REFERENCE_NOW)).toMatchObject({
      range: "90d",
      from: "2026-06-28",
      to: "2026-09-25",
      granularity: "week",
    });
  });

  it("parses and validates a custom range", () => {
    const valid = parseAnalyticsState(
      new URLSearchParams("range=custom&from=2026-08-01&to=2026-08-31"),
      REFERENCE_NOW,
    );
    expect(valid.customRangeError).toBeNull();
    expect(analyticsQuery(valid)).toEqual({
      from: "2026-08-01",
      to: "2026-08-31",
      granularity: "day",
    });

    const invalid = parseAnalyticsState(
      new URLSearchParams("range=custom&from=2026-09-10&to=2026-09-01"),
      REFERENCE_NOW,
    );
    expect(invalid.customRangeError).toBe("The start date must be on or before the end date.");
    expect(analyticsQuery(invalid)).toBeNull();
  });

  it("serializes only analytics-owned parameters and preserves other state", () => {
    expect(
      serializeAnalyticsState(
        {
          range: "custom",
          from: "2026-08-01",
          to: "2026-08-31",
          granularity: "month",
          tab: "audience",
        },
        "section=users&range=7d&granularity=day",
      ),
    ).toBe("section=users&range=custom&from=2026-08-01&to=2026-08-31&granularity=month&tab=audience");
  });

  it("creates distinct future chart keys when the query changes", () => {
    const daily = analyticsQueryKey("user-growth", {
      from: "2026-08-01",
      to: "2026-08-31",
      granularity: "day",
    });
    const monthly = analyticsQueryKey("user-growth", {
      from: "2026-08-01",
      to: "2026-08-31",
      granularity: "month",
    });

    expect(daily).not.toEqual(monthly);
    expect(dashboardsForTab("overview").map((dashboard) => dashboard.id)).toEqual([
      "user-growth",
      "active-users",
      "registrations",
    ]);
  });
});

