"use client";

import {
  AreaChart,
  BarChart,
  ChartCard,
  DonutChart,
  HorizontalBarChart,
  LineChart,
} from "@/components/charts";
import { ApiError } from "@/lib/api/errors";
import { formatDate } from "@/lib/utils/date";
import { useAnalyticsDashboard } from "@/services/analytics";

import {
  type AnalyticsDashboardId,
  type AnalyticsQuery,
} from "./analytics-state";
import type {
  AnalyticsDistributionPoint,
  AnalyticsTrendPoint,
} from "./analytics-types";
import { AnalyticsExportButton } from "./analytics-export";

interface AnalyticsDashboardProps {
  dashboard: {
    id: AnalyticsDashboardId;
    label: string;
  };
  query: AnalyticsQuery | null;
}

function formatAnalyticsDate(value: string): string {
  try {
    return formatDate(value);
  } catch {
    return value;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Maps stable API error codes to safe UI copy without exposing server messages. */
function analyticsError(error: unknown): string | null {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 401 || error.code === "UNAUTHORIZED") {
      return "Your admin session has expired. Sign in again to view analytics.";
    }
    if (error.status === 403 || error.code === "FORBIDDEN") {
      return "You do not have permission to view analytics.";
    }
    if (error.status === 0) {
      return "The analytics service could not be reached. Try again later.";
    }
  }

  return "The analytics service could not return this dashboard. Try again later.";
}

function hasPositiveCount(points: readonly { count: number }[]): boolean {
  return points.some((point) => point.count > 0);
}

function pausedOrEmpty(query: AnalyticsQuery | null, hasData: boolean): boolean {
  return query === null || (!hasData);
}

function emptyMessage(query: AnalyticsQuery | null, message: string): string {
  return query === null ? "Choose a valid range to load this dashboard" : message;
}

function TrendChart({ trend }: { trend: AnalyticsTrendPoint[] }) {
  const labels = Array.from(new Set(trend.map((point) => point.label)));
  const byBucket = new Map<string, Record<string, unknown>>();

  for (const point of trend) {
    const row = byBucket.get(point.bucket) ?? { bucket: point.bucket };
    row[point.label] = point.count;
    byBucket.set(point.bucket, row);
  }

  return (
    <div className="mt-4 border-t border-border/70 pt-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Trend over the selected range</p>
      <LineChart
        data={Array.from(byBucket.values())}
        index="bucket"
        categories={labels}
        height={190}
        labelFormatter={formatAnalyticsDate}
      />
    </div>
  );
}

function UserGrowthDashboard({ query }: { query: AnalyticsQuery | null }) {
  const result = useAnalyticsDashboard("user-growth", query);
  const points = result.data?.points ?? [];
  const chartData = points.map((point) => ({
    bucket: point.bucket,
    "Registered users": point.count,
  }));

  return (
    <ChartCard
      title="User growth"
      description="Cumulative registered users by Phnom Penh calendar bucket"
      action={<AnalyticsExportButton series="user-growth" title="User growth" query={query} />}
      loading={result.isLoading}
      error={analyticsError(result.error)}
      empty={!result.isLoading && !result.error && pausedOrEmpty(query, points.length > 0)}
      emptyMessage={emptyMessage(query, "No user-growth records for this timeframe")}
    >
      <AreaChart
        data={chartData}
        index="bucket"
        categories={["Registered users"]}
        height={280}
        dateFormatter={formatAnalyticsDate}
      />
    </ChartCard>
  );
}

function ActiveUsersDashboard({ query }: { query: AnalyticsQuery | null }) {
  const result = useAnalyticsDashboard("active-users", query);
  const points = result.data?.points ?? [];
  const chartData = points.map((point) => ({
    bucket: point.bucket,
    DAU: point.dau,
    MAU: point.mau,
  }));
  const estimated = result.data?.estimated ?? true;

  return (
    <ChartCard
      title="Daily and monthly active users"
      description="Distinct users with successful login or refresh activity"
      action={
        <AnalyticsExportButton
          series="active-users"
          title="Daily and monthly active users"
          query={query}
          estimated={estimated}
        />
      }
      loading={result.isLoading}
      error={analyticsError(result.error)}
      empty={!result.isLoading && !result.error && pausedOrEmpty(query, points.length > 0)}
      emptyMessage={emptyMessage(query, "No active-user records for this timeframe")}
    >
      {estimated ? (
        <p className="mb-3 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Estimated proxy: login and refresh activity can undercount short sessions and overcount
          background refreshes. Use this chart for trend direction, not an absolute user count.
        </p>
      ) : null}
      <LineChart
        data={chartData}
        index="bucket"
        categories={["DAU", "MAU"]}
        height={250}
        labelFormatter={formatAnalyticsDate}
      />
    </ChartCard>
  );
}

function RegistrationsDashboard({ query }: { query: AnalyticsQuery | null }) {
  const result = useAnalyticsDashboard("registrations", query);
  const points = result.data?.points ?? [];
  const chartData = points.map((point) => ({
    bucket: point.bucket,
    Local: point.local,
    Google: point.google,
    Other: point.other,
  }));

  return (
    <ChartCard
      title="Registration trend"
      description="New signups split by authentication provider"
      action={<AnalyticsExportButton series="registrations" title="Registration trend" query={query} />}
      loading={result.isLoading}
      error={analyticsError(result.error)}
      empty={!result.isLoading && !result.error && pausedOrEmpty(query, points.length > 0)}
      emptyMessage={emptyMessage(query, "No registration records for this timeframe")}
    >
      <BarChart
        data={chartData}
        index="bucket"
        categories={["Local", "Google", "Other"]}
        stacked
        height={280}
        labelFormatter={formatAnalyticsDate}
      />
    </ChartCard>
  );
}

type DistributionDashboardId =
  | "user-status"
  | "universities"
  | "work-status"
  | "languages"
  | "platforms";

function DistributionDashboard({
  id,
  title,
  description,
  query,
  kind,
  showTrend = false,
}: {
  id: DistributionDashboardId;
  title: string;
  description: string;
  query: AnalyticsQuery | null;
  kind: "donut" | "horizontal";
  showTrend?: boolean;
}) {
  const result = useAnalyticsDashboard(id, query);
  const distribution = result.data?.distribution ?? [];
  const trend = result.data?.trend ?? [];
  const chartData = distribution.map((point: AnalyticsDistributionPoint) => ({
    label: point.label,
    name: point.label,
    value: point.count,
    Count: point.count,
  }));
  const empty = !result.isLoading && !result.error && !hasPositiveCount(distribution);

  return (
    <ChartCard
      title={title}
      description={description}
      action={<AnalyticsExportButton series={id} title={title} query={query} />}
      loading={result.isLoading}
      error={analyticsError(result.error)}
      empty={!result.isLoading && !result.error && (query === null || empty)}
      emptyMessage={emptyMessage(query, `No ${title.toLowerCase()} records for this timeframe`)}
    >
      {kind === "donut" ? (
        <DonutChart
          data={chartData}
          centerSublabel="Users"
          height={280}
          valueFormatter={formatNumber}
        />
      ) : (
        <HorizontalBarChart
          data={chartData}
          index="label"
          categories={["Count"]}
          height={Math.max(280, Math.min(520, chartData.length * 34 + 80))}
          valueFormatter={formatNumber}
        />
      )}
      <ul className="sr-only" aria-label={`${title} data values`}>
        {distribution.map((point) => (
          <li key={point.label}>
            {point.label}: {formatNumber(point.count)}
          </li>
        ))}
      </ul>
      {showTrend && trend.length > 0 ? <TrendChart trend={trend} /> : null}
    </ChartCard>
  );
}

function XpDistributionDashboard({ query }: { query: AnalyticsQuery | null }) {
  const result = useAnalyticsDashboard("xp-distribution", query);
  const buckets = result.data?.buckets ?? [];
  const levels = result.data?.levels ?? [];
  const chartData = buckets.map((point) => ({
    label: point.label,
    Users: point.count,
  }));
  const levelData = levels.map((point) => ({
    label: `Level ${point.level}`,
    Users: point.count,
  }));
  const empty =
    !result.isLoading &&
    !result.error &&
    !hasPositiveCount(buckets) &&
    !hasPositiveCount(levels);

  return (
    <ChartCard
      title="XP distribution"
      description="XP buckets with the corresponding level pyramid"
      action={<AnalyticsExportButton series="xp-distribution" title="XP distribution" query={query} />}
      loading={result.isLoading}
      error={analyticsError(result.error)}
      empty={!result.isLoading && !result.error && (query === null || empty)}
      emptyMessage={emptyMessage(query, "No XP distribution records for this timeframe")}
    >
      <BarChart
        data={chartData}
        index="label"
        categories={["Users"]}
        height={250}
        labelFormatter={(value) => value}
      />
      {levelData.length > 0 ? (
        <div className="mt-4 border-t border-border/70 pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Level counts</p>
          <HorizontalBarChart
            data={levelData}
            index="label"
            categories={["Users"]}
            height={Math.max(180, Math.min(360, levelData.length * 30 + 60))}
            valueFormatter={formatNumber}
          />
        </div>
      ) : null}
    </ChartCard>
  );
}

export function AnalyticsDashboard({ dashboard, query }: AnalyticsDashboardProps) {
  switch (dashboard.id) {
    case "user-growth":
      return <UserGrowthDashboard query={query} />;
    case "active-users":
      return <ActiveUsersDashboard query={query} />;
    case "registrations":
      return <RegistrationsDashboard query={query} />;
    case "user-status":
      return (
        <DistributionDashboard
          id="user-status"
          title="User status"
          description="Account-status distribution with a trend over time"
          query={query}
          kind="donut"
          showTrend
        />
      );
    case "universities":
      return (
        <DistributionDashboard
          id="universities"
          title="University statistics"
          description="Top universities, with remaining values grouped as Other"
          query={query}
          kind="horizontal"
        />
      );
    case "work-status":
      return (
        <DistributionDashboard
          id="work-status"
          title="Work status distribution"
          description="Distribution across the fixed work-status categories"
          query={query}
          kind="donut"
        />
      );
    case "languages":
      return (
        <DistributionDashboard
          id="languages"
          title="Language usage"
          description="Preferred-language distribution with a trend over time"
          query={query}
          kind="donut"
          showTrend
        />
      );
    case "xp-distribution":
      return <XpDistributionDashboard query={query} />;
    case "platforms":
      return (
        <DistributionDashboard
          id="platforms"
          title="Platform usage"
          description="Approximate client platform split; Unknown is retained explicitly"
          query={query}
          kind="donut"
        />
      );
  }
}
