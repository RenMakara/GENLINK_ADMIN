// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AreaChart,
  BarChart,
  CHART_PALETTE,
  ChartCard,
  DonutChart,
  HorizontalBarChart,
  LineChart,
  getChartColor,
} from "./index";

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

describe("CHART_PALETTE", () => {
  it("defines the SSOT §11.2 primary palette colors", () => {
    expect(CHART_PALETTE).toContain("#1F5B3A");
    expect(CHART_PALETTE).toContain("#4BAE73");
    expect(CHART_PALETTE).toContain("#BDF4D3");
    expect(CHART_PALETTE.length).toBeGreaterThanOrEqual(6);
  });

  it("cycles colors correctly via getChartColor", () => {
    expect(getChartColor(0)).toBe("#1F5B3A");
    expect(getChartColor(1)).toBe("#4BAE73");
    expect(getChartColor(CHART_PALETTE.length)).toBe("#1F5B3A");
  });
});

describe("ChartCard", () => {
  it("renders title and description", () => {
    render(<ChartCard title="User Growth" description="Last 90 days cumulative growth" />);

    expect(screen.getByText("User Growth")).toBeDefined();
    expect(screen.getByText("Last 90 days cumulative growth")).toBeDefined();
  });

  it("renders loading skeleton when loading is true", () => {
    render(<ChartCard title="User Growth" loading />);

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByLabelText("Loading chart data")).toBeDefined();
  });

  it("renders error alert when error is provided", () => {
    render(<ChartCard title="User Growth" error="Failed to fetch network data" />);

    expect(screen.getByText("Failed to load chart data")).toBeDefined();
    expect(screen.getByText("Failed to fetch network data")).toBeDefined();
  });

  it("renders empty state when empty is true", () => {
    render(
      <ChartCard
        title="User Growth"
        empty
        emptyMessage="No registration records in this timeframe"
      />,
    );

    expect(screen.getByText("No registration records in this timeframe")).toBeDefined();
  });

  it("renders children when state is ready", () => {
    render(
      <ChartCard title="User Growth">
        <div data-testid="chart-content">Chart Content</div>
      </ChartCard>,
    );

    expect(screen.getByTestId("chart-content")).toBeDefined();
  });
});

describe("Chart Wrappers — Empty Data Safety", () => {
  const emptyData: Array<Record<string, unknown>> = [];

  it("AreaChart returns null on empty data", () => {
    const { container } = render(
      <AreaChart data={emptyData} index="date" categories={["users"]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("BarChart returns null on empty data", () => {
    const { container } = render(
      <BarChart data={emptyData} index="date" categories={["users"]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("LineChart returns null on empty data", () => {
    const { container } = render(
      <LineChart data={emptyData} index="date" categories={["users"]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("DonutChart returns null on empty data", () => {
    const { container } = render(<DonutChart data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("HorizontalBarChart returns null on empty data", () => {
    const { container } = render(
      <HorizontalBarChart data={emptyData} index="name" categories={["count"]} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("Chart Wrappers — Rendering with Sample Data", () => {
  const sampleTimeSeries = [
    { date: "2026-08-01", users: 100, active: 80 },
    { date: "2026-08-02", users: 150, active: 120 },
  ];

  const sampleDonutData = [
    { name: "Active", value: 400 },
    { name: "Suspended", value: 30 },
    { name: "Banned", value: 10 },
  ];

  it("renders AreaChart with data", () => {
    render(<AreaChart data={sampleTimeSeries} index="date" categories={["users", "active"]} />);
    expect(screen.getByTestId("responsive-container")).toBeDefined();
  });

  it("renders BarChart with data", () => {
    render(<BarChart data={sampleTimeSeries} index="date" categories={["users"]} />);
    expect(screen.getByTestId("responsive-container")).toBeDefined();
  });

  it("renders LineChart with data", () => {
    render(<LineChart data={sampleTimeSeries} index="date" categories={["active"]} />);
    expect(screen.getByTestId("responsive-container")).toBeDefined();
  });

  it("renders DonutChart with data and center label", () => {
    render(<DonutChart data={sampleDonutData} centerSublabel="Total Users" />);
    expect(screen.getByTestId("responsive-container")).toBeDefined();
    expect(screen.getByText("Total Users")).toBeDefined();
    expect(screen.getByText("440")).toBeDefined();
  });

  it("renders HorizontalBarChart with data", () => {
    render(
      <HorizontalBarChart
        data={[{ name: "University", count: 12 }]}
        index="name"
        categories={["count"]}
      />,
    );
    expect(screen.getByTestId("responsive-container")).toBeDefined();
  });
});
