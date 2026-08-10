"use client";

import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/common";
import {
  DashboardCharts,
  KpiCardRow,
  QuickActionsPanel,
  RecentActivityPanels,
  SystemHealthPanel,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { useDashboardSummary, useSystemHealth } from "@/services/dashboard";

/**
 * Main Admin Dashboard Overview Page (SSOT §2, ADM-056).
 *
 * <p>Composes KPI card row, Phase 2 charts, Quick Actions, System Health summary, and Recent
 * Activity panels. Each subsystem query degrades independently so an Actuator failure leaves
 * the KPI cards and charts intact (SSOT §2, AC#1).
 */
export default function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const healthQuery = useSystemHealth();

  const isRefreshing = summaryQuery.isFetching || healthQuery.isFetching;

  const handleRefresh = () => {
    void summaryQuery.refetch();
    void healthQuery.refetch();
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="GenLink KH Admin Portal Overview (Asia/Phnom_Penh)"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden />
            Refresh
          </Button>
        }
      />

      {/* Row 1: KPI Cards */}
      <KpiCardRow
        summary={summaryQuery.data?.summary}
        loading={summaryQuery.isLoading}
      />

      {/* Row 2: Dashboard Charts */}
      <DashboardCharts
        data={summaryQuery.data}
        loading={summaryQuery.isLoading}
        error={summaryQuery.isError ? "Failed to load analytics metrics payload" : null}
      />

      {/* Row 3: Quick Actions & System Health */}
      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActionsPanel />
        <SystemHealthPanel
          data={healthQuery.data}
          loading={healthQuery.isLoading}
          error={healthQuery.isError ? "System health check endpoint unavailable" : null}
        />
      </div>

      {/* Row 4: Recent Activity Panels */}
      <RecentActivityPanels
        data={{
          adminActions: summaryQuery.data?.recentAdminActions,
          registrations: summaryQuery.data?.recentRegistrations,
        }}
        loading={summaryQuery.isLoading}
      />
    </div>
  );
}
