"use client";

import {
  AreaChart,
  BarChart,
  ChartCard,
  DonutChart,
  LineChart,
} from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SAMPLE_TIME_SERIES = [
  { date: "Aug 01", users: 120, active: 90 },
  { date: "Aug 02", users: 180, active: 130 },
  { date: "Aug 03", users: 240, active: 190 },
  { date: "Aug 04", users: 310, active: 250 },
  { date: "Aug 05", users: 400, active: 320 },
  { date: "Aug 06", users: 480, active: 390 },
  { date: "Aug 07", users: 550, active: 460 },
];

const SAMPLE_DONUT_DATA = [
  { name: "Active", value: 1250 },
  { name: "Suspended", value: 85 },
  { name: "Banned", value: 24 },
  { name: "Pending", value: 117 },
];

/**
 * Developer gallery for ADM-050 Chart Component Library.
 *
 * <p>Renders all four chart wrappers (Area, Bar, Line, Donut) and all three ChartCard states
 * (Loading, Error, Empty) to verify theme switching, responsive container math, and accessibility.
 */
export function ChartsShowcase() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chart Component Library (ADM-050)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Area Chart */}
          <ChartCard
            title="User Growth (AreaChart)"
            description="90-day cumulative user registrations"
            action={<Button variant="outline" size="sm">Export</Button>}
          >
            <AreaChart
              data={SAMPLE_TIME_SERIES}
              index="date"
              categories={["users", "active"]}
              height={260}
            />
          </ChartCard>

          {/* Bar Chart */}
          <ChartCard
            title="Daily Registrations (BarChart)"
            description="New signups per Phnom Penh calendar day"
          >
            <BarChart
              data={SAMPLE_TIME_SERIES}
              index="date"
              categories={["users"]}
              height={260}
            />
          </ChartCard>

          {/* Line Chart */}
          <ChartCard
            title="DAU vs MAU Trends (LineChart)"
            description="Active users comparison"
          >
            <LineChart
              data={SAMPLE_TIME_SERIES}
              index="date"
              categories={["users", "active"]}
              height={260}
            />
          </ChartCard>

          {/* Donut Chart */}
          <ChartCard
            title="Account Status Split (DonutChart)"
            description="Distribution across user account states"
          >
            <DonutChart
              data={SAMPLE_DONUT_DATA}
              centerSublabel="Total Accounts"
              height={260}
            />
          </ChartCard>
        </div>

        {/* State Verification Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ChartCard
            title="ChartCard Loading State"
            description="Skeleton state while fetching payload"
            loading
            minHeight={200}
          />

          <ChartCard
            title="ChartCard Error State"
            description="Network failure fallback"
            error="Unable to connect to analytics endpoint"
            minHeight={200}
          />

          <ChartCard
            title="ChartCard Empty State"
            description="Zero data available for date range"
            empty
            emptyMessage="No analytics events recorded for this timeframe"
            minHeight={200}
          />
        </div>
      </CardContent>
    </Card>
  );
}
