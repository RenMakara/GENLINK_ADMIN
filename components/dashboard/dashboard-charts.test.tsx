// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ActivityTrendsChart,
  DashboardCharts,
  RegistrationsChart,
  StatusSplitChart,
  UserGrowthChart,
  formatChartDate,
} from "./dashboard-charts";

afterEach(() => {
  cleanup();
});

// Mock ResponsiveContainer for Recharts testing in jsdom
vi.mock("recharts", async () => {
  const original = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
  };
});

describe("DashboardCharts (ADM-052)", () => {
  const samplePayload = {
    userGrowth: [
      { date: "2026-08-01", count: 1000 },
      { date: "2026-08-02", count: 1050 },
    ],
    registrations: [
      { date: "2026-08-01", count: 30 },
      { date: "2026-08-02", count: 50 },
    ],
    activityTrends: [
      { date: "2026-08-01", dau: 300, mau: 800 },
      { date: "2026-08-02", dau: 320, mau: 820 },
    ],
    statusSplit: [
      { status: "ACTIVE", count: 800 },
      { status: "PENDING", count: 100 },
    ],
  };

  it("renders all four Phase 2 chart titles (AC#1)", () => {
    render(<DashboardCharts data={samplePayload} />);

    expect(screen.getByText("User growth (90d)")).toBeDefined();
    expect(screen.getByText("Registrations (30d)")).toBeDefined();
    expect(screen.getByText("DAU vs MAU (30d)")).toBeDefined();
    expect(screen.getByText("Account status split")).toBeDefined();
  });

  it("formats dates via formatChartDate (AC#2)", () => {
    const formatted = formatChartDate("2026-08-01T00:00:00.000Z");
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  it("renders empty state for each chart when series data is null/empty (AC#3)", () => {
    render(
      <div>
        <UserGrowthChart data={[]} />
        <RegistrationsChart data={[]} />
        <ActivityTrendsChart data={[]} />
        <StatusSplitChart data={[]} />
      </div>,
    );

    expect(screen.getByText("No user growth records recorded")).toBeDefined();
    expect(screen.getByText("No registration records for this timeframe")).toBeDefined();
    expect(screen.getByText("No activity trend data available")).toBeDefined();
    expect(screen.getByText("No account status records available")).toBeDefined();
  });
});
