// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import DashboardPage from "./page";

// Mock the query hooks to test independent section degradation (AC#1)
vi.mock("@/services/dashboard", () => ({
  useDashboardSummary: vi.fn(),
  useSystemHealth: vi.fn(),
}));

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => ({
    permissions: ["user:read", "user:verify_email", "user:export", "rbac:manage"],
  }),
}));

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

import { useDashboardSummary, useSystemHealth } from "@/services/dashboard";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DashboardPage (ADM-056)", () => {
  const mockSummary = {
    summary: {
      totalUsers: 1284,
      activeUsers: 1058,
      newToday: 42,
      dau: 412,
      mau: 980,
      pendingVerification: 117,
      bannedOrSuspended: 24,
    },
    userGrowth: [{ date: "2026-08-01", count: 1000 }],
    registrations: [{ date: "2026-08-01", count: 42 }],
    activityTrends: [{ date: "2026-08-01", dau: 412, mau: 980 }],
    statusSplit: [{ status: "ACTIVE", count: 1058 }],
    recentAdminActions: [
      {
        id: "act-1",
        actorEmail: "sok.dara@genlink.kh",
        action: "USER_SUSPEND",
        target: "chan.vibol@gmail.com",
        timestamp: "2026-08-10T08:15:00.000Z",
      },
    ],
    recentRegistrations: [
      {
        id: "reg-1",
        fullName: "Morm Rotana",
        email: "morm.rotana@rupp.edu.kh",
        status: "PENDING",
        joinedAt: "2026-08-10T08:30:00.000Z",
      },
    ],
  };

  it("renders all dashboard sections when queries succeed", () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardSummary>);

    vi.mocked(useSystemHealth).mockReturnValue({
      data: {
        status: "UP",
        api: { status: "UP" },
        database: { status: "UP" },
        storage: { status: "UP" },
        mail: { status: "UP", enabled: true, lastOutcome: "NEVER_RUN" },
        scheduledJobs: [],
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSystemHealth>);

    render(<DashboardPage />);

    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Total Users")).toBeDefined();
    expect(screen.getByText("User growth (90d)")).toBeDefined();
    expect(screen.getByText("Quick Actions")).toBeDefined();
    expect(screen.getByText("System Health Summary")).toBeDefined();
    expect(screen.getByText("Recent Admin Actions")).toBeDefined();
  });

  it("degrades independently: health endpoint error leaves KPI row, charts, and activity intact (AC#1)", () => {
    vi.mocked(useDashboardSummary).mockReturnValue({
      data: mockSummary,
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDashboardSummary>);

    vi.mocked(useSystemHealth).mockReturnValue({
      data: null,
      isLoading: false,
      isFetching: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSystemHealth>);

    render(<DashboardPage />);

    // Health panel shows error alert
    expect(screen.getByText("Health Check Unavailable")).toBeDefined();

    // KPI cards, charts, and activity panels remain fully rendered
    expect(screen.getByText("Total Users")).toBeDefined();
    expect(screen.getByText("User growth (90d)")).toBeDefined();
    expect(screen.getByText("sok.dara@genlink.kh")).toBeDefined();
  });
});
