import { describe, expect, it } from "vitest";

import { analyticsEndpoint, analyticsQueryParams } from "./analytics";

describe("analytics service contract (ADM-118)", () => {
  it("maps every dashboard id to the documented endpoint", () => {
    expect(analyticsEndpoint("user-growth")).toBe("/admin/analytics/user-growth");
    expect(analyticsEndpoint("active-users")).toBe("/admin/analytics/active-users");
    expect(analyticsEndpoint("registrations")).toBe("/admin/analytics/registrations");
    expect(analyticsEndpoint("user-status")).toBe("/admin/analytics/user-status");
    expect(analyticsEndpoint("universities")).toBe("/admin/analytics/universities");
    expect(analyticsEndpoint("work-status")).toBe("/admin/analytics/work-status");
    expect(analyticsEndpoint("languages")).toBe("/admin/analytics/languages");
    expect(analyticsEndpoint("xp-distribution")).toBe("/admin/analytics/xp-distribution");
    expect(analyticsEndpoint("platforms")).toBe("/admin/analytics/platforms");
  });

  it("sends the URL-owned query fields without changing their names", () => {
    expect(
      analyticsQueryParams({ from: "2026-08-01", to: "2026-08-31", granularity: "week" }),
    ).toEqual({ from: "2026-08-01", to: "2026-08-31", granularity: "week" });
  });
});
