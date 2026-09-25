// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AnalyticsDashboard } from "./analytics-dashboards";

const query = { from: "2026-08-01", to: "2026-08-31", granularity: "day" as const };
const useAnalyticsDashboardMock = vi.hoisted(() => vi.fn());

const analyticsData = {
  "user-growth": {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    points: [{ bucket: "2026-08-01", count: 42 }],
  },
  "active-users": {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    estimated: true,
    points: [{ bucket: "2026-08-01", dau: 10, mau: 20 }],
  },
  registrations: {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    points: [{ bucket: "2026-08-01", local: 2, google: 1, other: 0, total: 3 }],
  },
  "user-status": {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    distribution: [{ label: "ACTIVE", count: 42 }],
    trend: [{ bucket: "2026-08-01", label: "ACTIVE", count: 42 }],
  },
  universities: {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    distribution: [{ label: "AC", count: 42 }, { label: "Other", count: 3 }],
    trend: [],
  },
  "work-status": {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    distribution: [{ label: "STUDENT", count: 42 }],
    trend: [],
  },
  languages: {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    distribution: [{ label: "KHMER", count: 42 }],
    trend: [{ bucket: "2026-08-01", label: "KHMER", count: 42 }],
  },
  "xp-distribution": {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    buckets: [{ label: "0-99", count: 42 }],
    levels: [{ level: 1, count: 42 }],
  },
  platforms: {
    from: query.from,
    to: query.to,
    granularity: query.granularity,
    distribution: [
      { label: "Android", count: 20 },
      { label: "iOS", count: 10 },
      { label: "Web", count: 5 },
      { label: "Unknown", count: 7 },
    ],
    trend: [],
  },
} as const;

vi.mock("@/services/analytics", () => ({
  useAnalyticsDashboard: useAnalyticsDashboardMock,
}));

vi.mock("@/hooks/use-permission", () => ({
  usePermissions: () => ({ ready: true, has: () => true }),
}));

vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

afterEach(() => {
  cleanup();
  useAnalyticsDashboardMock.mockReset();
});

function useSampleAnalyticsData(id: keyof typeof analyticsData) {
  return {
    data: analyticsData[id],
    error: null,
    isLoading: false,
  };
}

describe("analytics dashboards (ADM-118)", () => {
  it("renders all three overview payloads and labels active users estimated", () => {
    useAnalyticsDashboardMock.mockImplementation((id: keyof typeof analyticsData) =>
      useSampleAnalyticsData(id),
    );
    render(
      <>
        <AnalyticsDashboard dashboard={{ id: "user-growth", label: "User growth" }} query={query} />
        <AnalyticsDashboard dashboard={{ id: "active-users", label: "Active users" }} query={query} />
        <AnalyticsDashboard dashboard={{ id: "registrations", label: "Registrations" }} query={query} />
      </>,
    );

    expect(screen.getByText("User growth")).toBeDefined();
    expect(screen.getByText("Daily and monthly active users")).toBeDefined();
    expect(screen.getByText("Estimated")).toBeDefined();
    expect(screen.getByText("Registration trend")).toBeDefined();
  });

  it("keeps platform Unknown visible and renders distribution trends", () => {
    useAnalyticsDashboardMock.mockImplementation((id: keyof typeof analyticsData) =>
      useSampleAnalyticsData(id),
    );
    render(
      <>
        <AnalyticsDashboard dashboard={{ id: "platforms", label: "Platform usage" }} query={query} />
        <AnalyticsDashboard dashboard={{ id: "languages", label: "Language usage" }} query={query} />
      </>,
    );

    expect(screen.getAllByText("Platform usage").length).toBeGreaterThan(0);
    expect(screen.getByText("Approximate client platform split; Unknown is retained explicitly")).toBeDefined();
    expect(screen.getByText(/Unknown:\s*7/)).toBeDefined();
    expect(screen.getByText("Trend over the selected range")).toBeDefined();
  });

  it("shows a safe error state and empty state", () => {
    useAnalyticsDashboardMock.mockReturnValue({
      data: undefined,
      error: new Error("do not show this raw error"),
      isLoading: false,
    } as never);

    const { rerender } = render(
      <AnalyticsDashboard dashboard={{ id: "user-growth", label: "User growth" }} query={query} />,
    );
    expect(screen.getByText("The analytics service could not return this dashboard. Try again later.")).toBeDefined();
    expect(screen.queryByText("do not show this raw error")).toBeNull();

    useAnalyticsDashboardMock.mockReturnValue({
      data: { ...analyticsData["user-growth"], points: [] },
      error: null,
      isLoading: false,
    });
    rerender(<AnalyticsDashboard dashboard={{ id: "user-growth", label: "User growth" }} query={query} />);
    expect(screen.getByText("No user-growth records for this timeframe")).toBeDefined();
  });

  it("shows the shared loading state while a dashboard request is pending", () => {
    useAnalyticsDashboardMock.mockReturnValue({ data: undefined, error: null, isLoading: true });

    render(
      <AnalyticsDashboard dashboard={{ id: "active-users", label: "Active users" }} query={query} />,
    );

    expect(screen.getByLabelText("Loading chart data")).toBeDefined();
  });
});
