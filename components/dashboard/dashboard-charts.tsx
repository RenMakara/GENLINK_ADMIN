"use client";

import {
  AreaChart,
  BarChart,
  ChartCard,
  DonutChart,
  LineChart,
} from "@/components/charts";
import { formatDate } from "@/lib/utils/date";

export interface UserGrowthPoint {
  date: string;
  count: number;
}

export interface RegistrationPoint {
  date: string;
  count: number;
}

export interface ActivityPoint {
  date: string;
  dau: number;
  mau: number;
}

export interface StatusSplitPoint {
  status: string;
  count: number;
}

export interface DashboardChartsPayload {
  userGrowth?: UserGrowthPoint[] | null;
  registrations?: RegistrationPoint[] | null;
  activityTrends?: ActivityPoint[] | null;
  statusSplit?: StatusSplitPoint[] | null;
}

export interface DashboardChartsProps {
  /** Summary data payload containing chart series */
  data?: DashboardChartsPayload | null;
  /** True while payload is loading */
  loading?: boolean;
  /** Optional error message */
  error?: string | null;
  /** Container CSS class name */
  className?: string;
}

/** Formats an ISO date string into a Phnom Penh date label for chart axes (AC#2). */
export function formatChartDate(isoDate: string): string {
  try {
    return formatDate(isoDate);
  } catch {
    return isoDate;
  }
}

/** 1. User Growth (90d) AreaChart */
export function UserGrowthChart({
  data,
  loading = false,
  error,
}: {
  data?: UserGrowthPoint[] | null;
  loading?: boolean;
  error?: string | null;
}) {
  const formattedData =
    data && data.length > 0
      ? data.map((d) => ({
          dateLabel: formatChartDate(d.date),
          Users: d.count,
        }))
      : [];

  const isEmpty = !loading && !error && formattedData.length === 0;

  return (
    <ChartCard
      title="User growth (90d)"
      description="Cumulative registered users running total"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="No user growth records recorded"
    >
      <AreaChart
        data={formattedData}
        index="dateLabel"
        categories={["Users"]}
        height={260}
      />
    </ChartCard>
  );
}

/** 2. Registrations (30d) BarChart */
export function RegistrationsChart({
  data,
  loading = false,
  error,
}: {
  data?: RegistrationPoint[] | null;
  loading?: boolean;
  error?: string | null;
}) {
  const formattedData =
    data && data.length > 0
      ? data.map((d) => ({
          dateLabel: formatChartDate(d.date),
          Registrations: d.count,
        }))
      : [];

  const isEmpty = !loading && !error && formattedData.length === 0;

  return (
    <ChartCard
      title="Registrations (30d)"
      description="New signups per Phnom Penh calendar day"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="No registration records for this timeframe"
    >
      <BarChart
        data={formattedData}
        index="dateLabel"
        categories={["Registrations"]}
        height={260}
      />
    </ChartCard>
  );
}

/** 3. DAU vs MAU (30d) LineChart */
export function ActivityTrendsChart({
  data,
  loading = false,
  error,
}: {
  data?: ActivityPoint[] | null;
  loading?: boolean;
  error?: string | null;
}) {
  const formattedData =
    data && data.length > 0
      ? data.map((d) => ({
          dateLabel: formatChartDate(d.date),
          DAU: d.dau,
          MAU: d.mau,
        }))
      : [];

  const isEmpty = !loading && !error && formattedData.length === 0;

  return (
    <ChartCard
      title="DAU vs MAU (30d)"
      description="Daily vs monthly active users comparison"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="No activity trend data available"
    >
      <LineChart
        data={formattedData}
        index="dateLabel"
        categories={["DAU", "MAU"]}
        height={260}
      />
    </ChartCard>
  );
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PENDING: "Pending",
  SUSPENDED: "Suspended",
  BANNED: "Banned",
  DELETED: "Deleted",
};

/** 4. Account Status Split DonutChart */
export function StatusSplitChart({
  data,
  loading = false,
  error,
}: {
  data?: StatusSplitPoint[] | null;
  loading?: boolean;
  error?: string | null;
}) {
  const formattedData =
    data && data.length > 0
      ? data.map((d) => ({
          name: STATUS_LABELS[d.status] ?? d.status,
          value: d.count,
        }))
      : [];

  const isEmpty = !loading && !error && formattedData.length === 0;

  return (
    <ChartCard
      title="Account status split"
      description="Distribution across user account status categories"
      loading={loading}
      error={error}
      empty={isEmpty}
      emptyMessage="No account status records available"
    >
      <DonutChart
        data={formattedData}
        centerSublabel="Total Accounts"
        height={260}
      />
    </ChartCard>
  );
}

/** Renders the four dashboard chart panels. */
export function DashboardCharts({
  data,
  loading = false,
  error,
  className,
}: DashboardChartsProps) {
  return (
    <div className={`grid gap-6 md:grid-cols-2 ${className ?? ""}`}>
      <UserGrowthChart data={data?.userGrowth} loading={loading} error={error} />
      <RegistrationsChart data={data?.registrations} loading={loading} error={error} />
      <ActivityTrendsChart data={data?.activityTrends} loading={loading} error={error} />
      <StatusSplitChart data={data?.statusSplit} loading={loading} error={error} />
    </div>
  );
}
