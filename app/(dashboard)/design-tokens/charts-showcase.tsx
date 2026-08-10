"use client";

import {
  AreaChart,
  BarChart,
  ChartCard,
  DonutChart,
  LineChart,
} from "@/components/charts";
import { KpiCardRow, DashboardCharts, RecentActivityPanels } from "@/components/dashboard";
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
        <CardTitle>KPI Card Row (ADM-051)</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <KpiCardRow />

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Recent Activity Panels (ADM-053)
          </h3>
          <RecentActivityPanels
            data={{
              adminActions: [
                {
                  id: "act-1",
                  actorEmail: "sok.dara@genlink.kh",
                  action: "USER_SUSPEND",
                  target: "chan.vibol@gmail.com",
                  timestamp: "2026-08-10T08:15:00.000Z",
                },
                {
                  id: "act-2",
                  actorEmail: "admin@genlink.kh",
                  action: "ROLE_UPDATE",
                  target: "leang.sovon@genlink.kh",
                  timestamp: "2026-08-10T07:45:00.000Z",
                },
                {
                  id: "act-3",
                  actorEmail: "sok.dara@genlink.kh",
                  action: "VERIFY_EMAIL",
                  target: "morm.rotana@rupp.edu.kh",
                  timestamp: "2026-08-10T06:30:00.000Z",
                },
              ],
              registrations: [
                {
                  id: "reg-1",
                  fullName: "Morm Rotana",
                  email: "morm.rotana@rupp.edu.kh",
                  universityName: "Royal University of Phnom Penh",
                  status: "PENDING",
                  joinedAt: "2026-08-10T08:30:00.000Z",
                },
                {
                  id: "reg-2",
                  fullName: "Keo Bopha",
                  email: "keo.bopha@itc.edu.kh",
                  universityName: "Institute of Technology of Cambodia",
                  status: "ACTIVE",
                  joinedAt: "2026-08-10T08:00:00.000Z",
                },
              ],
            }}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Dashboard Charts (ADM-052)
          </h3>
          <DashboardCharts
            data={{
              userGrowth: [
                { date: "2026-08-01", count: 1120 },
                { date: "2026-08-02", count: 1150 },
                { date: "2026-08-03", count: 1190 },
                { date: "2026-08-04", count: 1215 },
                { date: "2026-08-05", count: 1240 },
                { date: "2026-08-06", count: 1265 },
                { date: "2026-08-07", count: 1284 },
              ],
              registrations: [
                { date: "2026-08-01", count: 30 },
                { date: "2026-08-02", count: 40 },
                { date: "2026-08-03", count: 25 },
                { date: "2026-08-04", count: 25 },
                { date: "2026-08-05", count: 25 },
                { date: "2026-08-06", count: 19 },
                { date: "2026-08-07", count: 42 },
              ],
              activityTrends: [
                { date: "2026-08-01", dau: 380, mau: 920 },
                { date: "2026-08-02", dau: 390, mau: 935 },
                { date: "2026-08-03", dau: 400, mau: 950 },
                { date: "2026-08-04", dau: 405, mau: 960 },
                { date: "2026-08-05", dau: 410, mau: 970 },
                { date: "2026-08-06", dau: 408, mau: 975 },
                { date: "2026-08-07", dau: 412, mau: 980 },
              ],
              statusSplit: [
                { status: "ACTIVE", count: 1058 },
                { status: "PENDING", count: 117 },
                { status: "SUSPENDED", count: 18 },
                { status: "BANNED", count: 6 },
                { status: "DELETED", count: 85 },
              ],
            }}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4">
            Chart Component Library (ADM-050)
          </h3>
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
        </div>
      </CardContent>
    </Card>
  );
}
